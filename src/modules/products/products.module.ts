import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Product } from '@domain/entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDestination =
          configService.get('upload.destination') || './uploads';

        // Ensure upload directory exists
        if (!existsSync(uploadDestination)) {
          mkdirSync(uploadDestination, { recursive: true });
        }

        // Create products directory
        const productsDir = `${uploadDestination}/products`;
        if (!existsSync(productsDir)) {
          mkdirSync(productsDir, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: productsDir,
            filename: (req, file, cb) => {
              const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
              const ext = file.originalname.split('.').pop();
              cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
            },
          }),
          limits: {
            fileSize:
              configService.get('upload.maxFileSize') || 5 * 1024 * 1024, // 5MB
          },
        };
      },
    }),
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
