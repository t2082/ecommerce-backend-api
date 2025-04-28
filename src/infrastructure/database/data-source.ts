import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
config();

const nodeEnv = process.env.NODE_ENV || 'development';

// Use PostgreSQL for all environments
let dataSourceOptions: DataSourceOptions;

dataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '6543', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'O@r0n*k2A',
  database: process.env.DB_DATABASE || 'postgres',
  schema: process.env.DB_SCHEMA || 'ecommerce_api',
  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/**/*{.ts,.js}')],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: nodeEnv === 'development',
  ssl: nodeEnv === 'production',
};

export { dataSourceOptions };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
