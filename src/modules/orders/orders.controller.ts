import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  OrderResponseDto,
} from '@application/dtos/order.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { UserRole } from '@domain/entities/user.entity';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { User } from '@domain/entities/user.entity';
import { plainToClass } from 'class-transformer';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findAll();
    return orders.map((order) => plainToClass(OrderResponseDto, order));
  }

  @Get('my-orders')
  async findMyOrders(@CurrentUser() user: User): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findAll(user.id);
    return orders.map((order) => plainToClass(OrderResponseDto, order));
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.findById(id);
    return plainToClass(OrderResponseDto, order);
  }

  @Get('my-orders/:id')
  async findMyOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.findById(id, user.id);
    return plainToClass(OrderResponseDto, order);
  }

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(createOrderDto, user);
    return plainToClass(OrderResponseDto, order);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updateStatus(
      id,
      updateOrderStatusDto,
    );
    return plainToClass(OrderResponseDto, order);
  }

  @Patch(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updatePaymentStatus(
      id,
      updatePaymentStatusDto,
    );
    return plainToClass(OrderResponseDto, order);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancelOrder(id);
    return plainToClass(OrderResponseDto, order);
  }

  @Post('my-orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelMyOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancelOrder(id, user.id);
    return plainToClass(OrderResponseDto, order);
  }
}
