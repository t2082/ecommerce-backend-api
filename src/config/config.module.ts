import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'staging')
          .default('development'),
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api'),

        // Database
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().default('postgres'),
        DB_DATABASE: Joi.string().default('ecommerce'),
        DB_SCHEMA: Joi.string().default('public'),
        DB_SYNCHRONIZE: Joi.boolean().default(false),

        // JWT
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1h'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').default(''),
        REDIS_TTL: Joi.number().default(3600),

        // Email
        MAIL_HOST: Joi.string().default('smtp.example.com'),
        MAIL_PORT: Joi.number().default(587),
        MAIL_USER: Joi.string().default('user@example.com'),
        MAIL_PASSWORD: Joi.string().default('password'),
        MAIL_FROM: Joi.string().default('noreply@example.com'),

        // File Upload
        UPLOAD_DESTINATION: Joi.string().default('./uploads'),
        MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB

        // Rate Limiting
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(10),
      }),
    }),
  ],
})
export class ConfigModule {}
