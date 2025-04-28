import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '@domain/entities/order.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { User } from '@domain/entities/user.entity';
import { ProductsService } from '@modules/products/products.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from '@application/dtos/order.dto';
import { EmailService } from '@infrastructure/email/email.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly productsService: ProductsService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(userId?: string): Promise<Order[]> {
    const where: FindOptionsWhere<Order> = {};

    if (userId) {
      where.user = { id: userId };
    }

    return this.orderRepository.find({
      where,
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId?: string): Promise<Order> {
    const where: FindOptionsWhere<Order> = { id };

    if (userId) {
      where.user = { id: userId };
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    // Validate items
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Create new order
    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      user,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress || createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      paymentMethod: createOrderDto.paymentMethod,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: 0,
      tax: 0,
      shippingCost: 0,
      discount: 0,
      total: 0,
    });

    // Save order to get ID
    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems: OrderItem[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findById(item.productId);

      // Check if product is in stock
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Product ${product.name} does not have enough stock`);
      }

      // Create order item
      const orderItem = this.orderItemRepository.create({
        order: savedOrder,
        product,
        quantity: item.quantity,
        unitPrice: product.price,
        discount: product.discountPercentage,
      });

      orderItems.push(await this.orderItemRepository.save(orderItem));

      // Update product stock
      await this.productsService.updateStock(product.id, -item.quantity);
    }

    // Update order with items
    savedOrder.items = orderItems;

    // Calculate totals
    savedOrder.calculateTotals();

    // Add tax (example: 10%)
    savedOrder.tax = savedOrder.subtotal * 0.1;

    // Add shipping cost (example: flat rate)
    savedOrder.shippingCost = 10;

    // Recalculate total
    savedOrder.calculateTotals();

    // Save updated order
    const finalOrder = await this.orderRepository.save(savedOrder);

    // Send order confirmation email
    await this.emailService.sendOrderConfirmationEmail(
      user.email,
      user.firstName,
      finalOrder.orderNumber,
      {
        total: finalOrder.total,
        items: finalOrder.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
      },
    );

    return finalOrder;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findById(id);

    // Validate status transition
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    // Update status
    order.status = updateOrderStatusDto.status;

    // Update tracking number if provided
    if (updateOrderStatusDto.trackingNumber) {
      order.trackingNumber = updateOrderStatusDto.trackingNumber;
    }

    return this.orderRepository.save(order);
  }

  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Order> {
    const order = await this.findById(id);

    // Update payment status
    order.paymentStatus = updatePaymentStatusDto.paymentStatus;

    // Update payment transaction ID if provided
    if (updatePaymentStatusDto.paymentTransactionId) {
      order.paymentTransactionId = updatePaymentStatusDto.paymentTransactionId;
    }

    // If payment is marked as paid, update order status if it's still pending
    if (
      updatePaymentStatusDto.paymentStatus === PaymentStatus.PAID &&
      order.status === OrderStatus.PENDING
    ) {
      order.status = OrderStatus.PROCESSING;
    }

    return this.orderRepository.save(order);
  }

  async cancelOrder(id: string, userId?: string): Promise<Order> {
    const order = await this.findById(id, userId);

    // Check if order can be cancelled
    if (!order.canCancel()) {
      throw new BadRequestException('This order cannot be cancelled due to its current status');
    }

    // Cancel order
    order.cancel();

    // Return items to inventory
    for (const item of order.items) {
      await this.productsService.updateStock(item.product.id, item.quantity);
    }

    return this.orderRepository.save(order);
  }

  private generateOrderNumber(): string {
    const timestamp = new Date().getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    // Define valid status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition order from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
