# E-Commerce Backend API

## Overview

A robust and scalable E-Commerce Backend API built with NestJS, TypeScript, PostgreSQL, and following Clean Architecture / Domain-Driven Design principles. This boilerplate provides a solid foundation for building e-commerce applications with features like authentication, product management, order processing, and more.

## Features

- **Authentication**

  - JWT + Refresh Token authentication
  - User registration and login
  - Password reset functionality
  - Role-based access control

- **User Management**

  - CRUD operations for users
  - Role management (Admin, Manager, Customer)
  - Profile management

- **Product Management**

  - CRUD operations for products
  - Product categorization
  - Image upload support
  - Stock management
  - Discount management

- **Order Management**

  - Order creation and processing
  - Order status tracking
  - Payment status tracking
  - Order history

- **Infrastructure**

  - PostgreSQL database with TypeORM
  - Redis for caching
  - BullMQ for task queues
  - Winston for logging
  - Email service with Nodemailer

- **Security**

  - Helmet for HTTP headers
  - Rate limiting
  - CORS protection
  - Input validation

- **Documentation**
  - Swagger API documentation

## Architecture

This project follows Clean Architecture / Domain-Driven Design principles with a clear separation of concerns:

- **Domain Layer**: Contains business entities, value objects, and domain services
- **Application Layer**: Contains use cases and application services
- **Infrastructure Layer**: Contains implementations of repositories, external services, etc.
- **Presentation Layer**: Contains controllers, DTOs, and API endpoints

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator & class-transformer
- **Logging**: Winston
- **Caching**: Redis
- **Task Queue**: BullMQ + Redis
- **Email**: Nodemailer
- **API Documentation**: Swagger
- **Testing**: Jest + SuperTest
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL
- Redis

## Installation

### Local Development

1. Clone the repository

```bash
git clone <repository-url>
cd ecommerce-backend
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file based on `.env.example`

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

5. Start the development server

```bash
npm run start:dev
```

### Using Docker

1. Clone the repository

```bash
git clone <repository-url>
cd ecommerce-backend
```

2. Create a `.env` file based on `.env.example`

```bash
cp .env.example .env
```

3. Build and start the containers

```bash
npm run docker:build
npm run docker:up
```

## Database Migrations

### Generate a migration

```bash
npm run migration:generate -- src/infrastructure/database/migrations/MigrationName
```

### Run migrations

```bash
npm run migration:run
```

### Revert migrations

```bash
npm run migration:revert
```

## API Documentation

Swagger API documentation is available at `/api/docs` when running in development mode.

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

## Folder Structure

```
src/
├── application/         # Application layer
│   ├── dtos/           # Data Transfer Objects
│   └── use-cases/      # Application use cases
├── config/             # Configuration
├── domain/             # Domain layer
│   ├── entities/       # Domain entities
│   ├── services/       # Domain services
│   └── value-objects/  # Value objects
├── infrastructure/     # Infrastructure layer
│   ├── cache/          # Cache implementation
│   ├── database/       # Database configuration and migrations
│   ├── email/          # Email service
│   ├── logging/        # Logging configuration
│   ├── queue/          # Queue implementation
│   └── security/       # Security configuration
├── modules/            # Feature modules
│   ├── auth/           # Authentication module
│   ├── orders/         # Order management module
│   ├── products/       # Product management module
│   └── users/          # User management module
└── presentation/       # Presentation layer
    ├── controllers/    # API controllers
    ├── filters/        # Exception filters
    ├── guards/         # Guards
    └── pipes/          # Validation pipes
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## How to add a new API?

# 1. Add to Controller (ecommerce-backend\src\modules\ex\ex.controller.ts)

# 2. Add to Dto (ecommerce-backend\src\application\dtos\ex.dto.ts)


## License

This project is licensed under the MIT License - see the LICENSE file for details.
