import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@domain/entities/order.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProductsModule } from '@modules/products/products.module';
import { AuthModule } from '@modules/auth/auth.module';
import { EmailModule } from '@infrastructure/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), ProductsModule, AuthModule, EmailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
