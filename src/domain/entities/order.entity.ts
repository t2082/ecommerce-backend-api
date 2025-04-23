import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column()
  orderNumber: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @Column({
    type: process.env.NODE_ENV === 'development' ? 'varchar' : 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: process.env.NODE_ENV === 'development' ? 'varchar' : 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column('simple-json')
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };

  @Column('simple-json', { nullable: true })
  billingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ nullable: true })
  paymentTransactionId?: string;

  calculateTotals(): void {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate total with tax, shipping, and discounts
    this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
  }

  canCancel(): boolean {
    return [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(this.status);
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new Error('This order cannot be cancelled');
    }
    this.status = OrderStatus.CANCELLED;
  }

  markAsPaid(): void {
    this.paymentStatus = PaymentStatus.PAID;
    if (this.status === OrderStatus.PENDING) {
      this.status = OrderStatus.PROCESSING;
    }
  }

  markAsShipped(trackingNumber: string): void {
    if (this.status !== OrderStatus.PROCESSING) {
      throw new Error('Order must be in processing status to be shipped');
    }
    this.trackingNumber = trackingNumber;
    this.status = OrderStatus.SHIPPED;
  }

  markAsDelivered(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new Error('Order must be shipped before it can be delivered');
    }
    this.status = OrderStatus.DELIVERED;
  }
}
