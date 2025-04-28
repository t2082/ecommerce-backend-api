import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('nodeEnv');

        // Use PostgreSQL for all environments
        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          schema: configService.get('database.schema'),
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          synchronize: configService.get('database.synchronize'),
          logging: nodeEnv === 'development',
          ssl: nodeEnv === 'production',
        };
      },
    }),
  ],
})
export class DatabaseModule { }
