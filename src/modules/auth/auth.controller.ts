import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  TokenResponseDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@application/dtos/auth.dto';
import { UserResponseDto } from '@application/dtos/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.authService.register(registerDto);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: any): Promise<void> {
    await this.authService.logout(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }
}
