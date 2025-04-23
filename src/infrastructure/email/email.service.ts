import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('mail.host'),
      port: this.configService.get('mail.port'),
      secure: this.configService.get('mail.port') === 465,
      auth: {
        user: this.configService.get('mail.user'),
        pass: this.configService.get('mail.password'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get('mail.from'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    username: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('appUrl')}/reset-password?token=${token}`;

    await this.sendMail({
      to,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${username},</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to our E-Commerce Platform',
      html: `
        <h1>Welcome to our E-Commerce Platform</h1>
        <p>Hello ${username},</p>
        <p>Thank you for registering with us. We're excited to have you on board!</p>
        <p>You can now start shopping and exploring our platform.</p>
        <p>Best regards,</p>
        <p>The E-Commerce Team</p>
      `,
    });
  }

  async sendOrderConfirmationEmail(
    to: string,
    username: string,
    orderNumber: string,
    orderDetails: any,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Order Confirmation #${orderNumber}`,
      html: `
        <h1>Order Confirmation</h1>
        <p>Hello ${username},</p>
        <p>Thank you for your order. Your order #${orderNumber} has been received and is being processed.</p>
        <h2>Order Details</h2>
        <p>Order Date: ${new Date().toLocaleDateString()}</p>
        <p>Order Total: $${orderDetails.total.toFixed(2)}</p>
        <h3>Items</h3>
        <ul>
          ${orderDetails.items
            .map(
              (item) => `
            <li>${item.quantity} x ${item.name} - $${item.price.toFixed(2)}</li>
          `,
            )
            .join('')}
        </ul>
        <p>You can track your order status in your account.</p>
        <p>Best regards,</p>
        <p>The E-Commerce Team</p>
      `,
    });
  }
}
