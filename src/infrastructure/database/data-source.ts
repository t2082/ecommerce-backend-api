import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
config();

const nodeEnv = process.env.NODE_ENV || 'development';

// Use SQLite for development
let dataSourceOptions: DataSourceOptions;

if (nodeEnv === 'development') {
  dataSourceOptions = {
    type: 'sqlite',
    database: 'ecommerce-backend.sqlite',
    entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, './migrations/**/*{.ts,.js}')],
    synchronize: true,
    logging: true,
  };
} else {
  // Use PostgreSQL for production
  dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ecommerce-backend',
    schema: process.env.DB_SCHEMA || 'public',
    entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, './migrations/**/*{.ts,.js}')],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: nodeEnv === 'development',
    ssl: nodeEnv === 'production',
  };
}

export { dataSourceOptions };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
