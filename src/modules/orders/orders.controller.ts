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

// Khai báo controller để xử lý các request liên quan đến orders
@Controller('orders') // -> Định nghĩa route cơ sở là /orders
@UseGuards(JwtAuthGuard) // -> Yêu cầu người dùng phải đăng nhập để truy cập tất cả API trong controller này
export class OrdersController {
  // Inject OrdersService để sử dụng các method xử lý logic
  constructor(private readonly ordersService: OrdersService) {}

  // API lấy tất cả đơn hàng - chỉ ADMIN và MANAGER mới được phép
  @Get() // -> GET /orders
  @UseGuards(RolesGuard) // -> Kiểm tra role người dùng
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // -> Chỉ định roles được phép
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findAll();
    // Chuyển đổi data từ entity sang DTO trước khi trả về
    return orders.map((order) => plainToClass(OrderResponseDto, order));
  }

  // API cho người dùng xem đơn hàng của họ
  @Get('my-orders') // -> GET /orders/my-orders
  async findMyOrders(@CurrentUser() user: User): Promise<OrderResponseDto[]> {
    // @CurrentUser() -> Lấy thông tin user đã đăng nhập
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
  async findMyOrder(@Param('id') id: string, @CurrentUser() user: User): Promise<OrderResponseDto> {
    const order = await this.ordersService.findById(id, user.id);
    return plainToClass(OrderResponseDto, order);
  }

  // API tạo đơn hàng mới
  @Post() // -> POST /orders
  async create(
    @Body() createOrderDto: CreateOrderDto, // -> Dữ liệu đơn hàng gửi lên
    @CurrentUser() user: User, // -> Thông tin người tạo đơn
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(createOrderDto, user);
    return plainToClass(OrderResponseDto, order);
  }

  // API cập nhật trạng thái đơn hàng - chỉ ADMIN/MANAGER
  @Patch(':id/status') // -> PATCH /orders/{id}/status
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateStatus(
    @Param('id') id: string, // -> ID đơn hàng
    @Body() updateOrderStatusDto: UpdateOrderStatusDto, // -> Trạng thái mới
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updateStatus(id, updateOrderStatusDto);
    return plainToClass(OrderResponseDto, order);
  }

  @Patch(':id/payment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.updatePaymentStatus(id, updatePaymentStatusDto);
    return plainToClass(OrderResponseDto, order);
  }

  // API hủy đơn hàng của admin
  @Post(':id/cancel') // -> POST /orders/{id}/cancel
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK) // -> Trả về status 200 thay vì 201
  async cancelOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancelOrder(id);
    return plainToClass(OrderResponseDto, order);
  }

  // API cho người dùng hủy đơn hàng của họ
  @Post('my-orders/:id/cancel') // -> POST /orders/my-orders/{id}/cancel
  @HttpCode(HttpStatus.OK)
  async cancelMyOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.cancelOrder(id, user.id);
    return plainToClass(OrderResponseDto, order);
  }
}
