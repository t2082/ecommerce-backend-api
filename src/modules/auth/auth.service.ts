import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@domain/entities/user.entity';
import { EmailService } from '@infrastructure/email/email.service';
import {
  LoginDto,
  RegisterDto,
  TokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@application/dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      email,
      password,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(user);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return savedUser;
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.save(user);

    return tokens;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate stored refresh token
      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update refresh token in database
      user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      await this.userRepository.save(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // Clear refresh token
    await this.userRepository.update(userId, { refreshToken: undefined });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return;
    }

    // Generate password reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Store hashed token in database
    user.refreshToken = await bcrypt.hash(resetToken, 10);
    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Find user with this reset token
    const users = await this.userRepository.find();

    // Find user with matching reset token
    let userToUpdate: User | undefined;
    for (const user of users) {
      if (user.refreshToken) {
        const isMatch = await bcrypt.compare(token, user.refreshToken);
        if (isMatch) {
          userToUpdate = user;
          break;
        }
      }
    }

    if (!userToUpdate) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Update password and clear reset token
    userToUpdate.password = newPassword;
    userToUpdate.refreshToken = undefined;
    await this.userRepository.save(userToUpdate);
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds(this.configService.get('jwt.expiresIn')),
    };
  }

  private getExpiresInSeconds(expiresIn: string | undefined): number {
    if (!expiresIn) return 3600; // Default to 1 hour

    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 3600; // Default to 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600;
    }
  }
}
