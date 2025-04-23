import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderItem } from './order-item.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  stockQuantity: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array', { nullable: true })
  categories: string[];

  @Column('simple-json', { nullable: true })
  attributes: Record<string, any>;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountPercentage: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  get isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  get finalPrice(): number {
    if (this.discountPercentage > 0) {
      return this.price * (1 - this.discountPercentage / 100);
    }
    return this.price;
  }

  decreaseStock(quantity: number): void {
    if (quantity > this.stockQuantity) {
      throw new Error('Not enough stock available');
    }
    this.stockQuantity -= quantity;
  }

  increaseStock(quantity: number): void {
    this.stockQuantity += quantity;
  }
}
