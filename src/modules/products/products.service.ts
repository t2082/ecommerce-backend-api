import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { Product } from '@domain/entities/product.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
} from '@application/dtos/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(filters?: ProductFilterDto): Promise<Product[]> {
    const where: FindOptionsWhere<Product> = {};

    if (filters) {
      // Apply search filter
      if (filters.search) {
        where.name = Like(`%${filters.search}%`);
      }

      // Apply category filter
      if (filters.categories && filters.categories.length > 0) {
        // This is a simplification - for array columns, you might need a custom query
        // depending on your database and ORM setup
        where.categories = Like(`%${filters.categories[0]}%`);
      }

      // Apply price range filter
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = Between(
          filters.minPrice || 0,
          filters.maxPrice || Number.MAX_SAFE_INTEGER,
        );
      }

      // Apply in-stock filter
      if (filters.inStock !== undefined) {
        where.stockQuantity = filters.inStock
          ? Between(1, Number.MAX_SAFE_INTEGER)
          : 0;
      }

      // Apply on-sale filter
      if (filters.onSale !== undefined) {
        where.discountPercentage = filters.onSale ? Between(0.01, 100) : 0;
      }
    }

    return this.productRepository.find({ where });
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findById(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.softRemove(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);

    if (quantity < 0 && Math.abs(quantity) > product.stockQuantity) {
      throw new Error('Not enough stock available');
    }

    product.stockQuantity += quantity;
    return this.productRepository.save(product);
  }
}
