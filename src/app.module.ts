import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Config
import { ConfigModule } from '@config/config.module';

// Infrastructure
import { DatabaseModule } from '@infrastructure/database/database.module';
import { CacheModule } from '@infrastructure/cache/cache.module';
import { QueueModule } from '@infrastructure/queue/queue.module';
import { EmailModule } from '@infrastructure/email/email.module';
import { LoggingModule } from '@infrastructure/logging/logging.module';
import { SecurityModule } from '@infrastructure/security/security.module';

// Modules
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { ProductsModule } from '@modules/products/products.module';
import { OrdersModule } from '@modules/orders/orders.module';

@Module({
  imports: [
    // Config
    ConfigModule,

    // Infrastructure
    DatabaseModule,
    CacheModule,
    QueueModule,
    EmailModule,
    LoggingModule,
    SecurityModule,

    // Serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Serve public files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
