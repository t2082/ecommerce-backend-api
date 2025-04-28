import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UserResponseDto,
} from '@application/dtos/user.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { UserRole } from '@domain/entities/user.entity';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { plainToClass } from 'class-transformer';
import { User } from '@domain/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map((user) =>
      plainToClass(UserResponseDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(user.id, updateUserDto);
    return plainToClass(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  async setRole(@Param('id') id: string, @Body('role') role: UserRole): Promise<UserResponseDto> {
    const user = await this.usersService.setRole(id, role);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
