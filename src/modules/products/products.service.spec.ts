import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from '@domain/entities/product.entity';
import { NotFoundException } from '@nestjs/common';

// Mock repository factory
const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          description: 'Description 1',
          price: 100,
          stockQuantity: 10,
          images: [],
          isActive: true,
          categories: [],
          attributes: {},
          discountPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest
        .spyOn(repository, 'find')
        .mockResolvedValue(mockProducts as Product[]);

      const result = await service.findAll();
      expect(result).toEqual(mockProducts);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        stockQuantity: 10,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProduct as Product);

      const result = await service.findById('1');
      expect(result).toEqual(mockProduct);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'New Description',
        price: 200,
        stockQuantity: 20,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
      };

      const mockProduct = {
        id: '1',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockProduct as Product);
      jest.spyOn(repository, 'save').mockResolvedValue(mockProduct as Product);

      const result = await service.create(createProductDto);
      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalledWith(createProductDto);
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto = {
        name: 'Updated Product',
        price: 300,
      };

      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        stockQuantity: 10,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...mockProduct,
        ...updateProductDto,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(updatedProduct as Product);

      const result = await service.update('1', updateProductDto);
      expect(result).toEqual(updatedProduct);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockProduct,
        ...updateProductDto,
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        stockQuantity: 10,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest.spyOn(repository, 'softRemove').mockResolvedValue(undefined);

      await service.remove('1');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.softRemove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('updateStock', () => {
    it('should increase product stock', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        stockQuantity: 10,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...mockProduct,
        stockQuantity: 15,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(updatedProduct as Product);

      const result = await service.updateStock('1', 5);
      expect(result).toEqual(updatedProduct);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockProduct,
        stockQuantity: 15,
      });
    });

    it('should decrease product stock', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        stockQuantity: 10,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...mockProduct,
        stockQuantity: 5,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(updatedProduct as Product);

      const result = await service.updateStock('1', -5);
      expect(result).toEqual(updatedProduct);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.save).toHaveBeenCalledWith({
        ...mockProduct,
        stockQuantity: 5,
      });
    });

    it('should throw error if trying to decrease more than available stock', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        stockQuantity: 10,
        images: [],
        isActive: true,
        categories: [],
        attributes: {},
        discountPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProduct as Product);

      await expect(service.updateStock('1', -15)).rejects.toThrow(
        'Not enough stock available',
      );
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
