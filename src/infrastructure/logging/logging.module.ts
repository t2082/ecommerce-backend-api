import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('nodeEnv') === 'production';

        // Define log format
        const logFormat = winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.splat(),
          winston.format.json(),
        );

        // Define transports
        const transports: winston.transport[] = [
          // Console transport
          new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            level: isProduction ? 'info' : 'debug',
          }),
        ];

        // Add file transports in production
        if (isProduction) {
          // Add daily rotate file for all logs
          transports.push(
            new winston.transports.DailyRotateFile({
              filename: 'logs/application-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '14d',
              level: 'info',
            }),
          );

          // Add daily rotate file for error logs
          transports.push(
            new winston.transports.DailyRotateFile({
              filename: 'logs/error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '14d',
              level: 'error',
            }),
          );
        }

        return {
          format: logFormat,
          transports,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
