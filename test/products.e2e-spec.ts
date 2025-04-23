import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/domain/entities/product.entity';
import { User, UserRole } from '../src/domain/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string;
  let adminAccessToken: string;
  let productRepository;
  let userRepository;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    stockQuantity: 10,
    images: [],
    isActive: true,
    categories: ['test'],
    attributes: {},
    discountPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: '1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin = {
    id: '2',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    productRepository = moduleFixture.get(getRepositoryToken(Product));
    userRepository = moduleFixture.get(getRepositoryToken(User));

    // Generate tokens
    accessToken = jwtService.sign(
      { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
      { secret: 'your-secret-key', expiresIn: '1h' },
    );

    adminAccessToken = jwtService.sign(
      { sub: mockAdmin.id, email: mockAdmin.email, role: mockAdmin.role },
      { secret: 'your-secret-key', expiresIn: '1h' },
    );

    // Mock repositories
    jest.spyOn(productRepository, 'find').mockResolvedValue([mockProduct]);
    jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
    jest.spyOn(productRepository, 'create').mockReturnValue(mockProduct);
    jest.spyOn(productRepository, 'save').mockResolvedValue(mockProduct);
    
    jest.spyOn(userRepository, 'findOne').mockImplementation((options) => {
      if (options.where.id === '1') return Promise.resolve(mockUser);
      if (options.where.id === '2') return Promise.resolve(mockAdmin);
      return Promise.resolve(null);
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    it('should return an array of products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('price');
        });
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by id', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', '1');
          expect(res.body).toHaveProperty('name', 'Test Product');
          expect(res.body).toHaveProperty('price', 100);
        });
    });

    it('should return 404 if product not found', () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(null);
      
      return request(app.getHttpServer())
        .get('/products/999')
        .expect(404);
    });
  });

  describe('POST /products', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 200,
          stockQuantity: 20,
        })
        .expect(401);
    });

    it('should require admin role', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 200,
          stockQuantity: 20,
        })
        .expect(403);
    });

    it('should create a new product with admin role', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 200,
          stockQuantity: 20,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test Product');
        });
    });

    it('should validate input data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          // Missing required fields
          price: 'invalid', // Invalid type
        })
        .expect(400);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .patch('/products/1')
        .send({
          name: 'Updated Product',
        })
        .expect(401);
    });

    it('should require admin role', () => {
      return request(app.getHttpServer())
        .patch('/products/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Product',
        })
        .expect(403);
    });

    it('should update a product with admin role', () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      jest.spyOn(productRepository, 'save').mockResolvedValueOnce(updatedProduct);
      
      return request(app.getHttpServer())
        .patch('/products/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Updated Product',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated Product');
        });
    });
  });

  describe('DELETE /products/:id', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .delete('/products/1')
        .expect(401);
    });

    it('should require admin role', () => {
      return request(app.getHttpServer())
        .delete('/products/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should delete a product with admin role', () => {
      jest.spyOn(productRepository, 'softRemove').mockResolvedValueOnce(undefined);
      
      return request(app.getHttpServer())
        .delete('/products/1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(204);
    });
  });
});
