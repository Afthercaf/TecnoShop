import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import authRoutes from '../routes/auth.routes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

// Default test MongoDB URI if not provided
const MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb';

describe('Authentication Integration Tests', () => {
  // Setup before all tests
  beforeAll(async () => {
    try {
      // Connect to a test database
      await mongoose.connect(MONGO_URI_TEST, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to test database');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    try {
      // Clear the database
      await mongoose.connection.dropDatabase();
      
      // Close the connection
      await mongoose.connection.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });

  // Clear database before each test
  beforeEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  // User registration test
  test('POST /api/auth/register should create a new user', async () => {
    // Validate input using Zod schema
    const validationResult = registerSchema.safeParse({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      direccion: '123 Test Street',
      tipo: 'normal',
      telefono: '1234567890'
    });

    // Ensure input passes validation
    expect(validationResult.success).toBe(true);

    // Send registration request
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        direccion: '123 Test Street',
        tipo: 'normal',
        telefono: '1234567890'
      });
    
    // Assertions
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('username', 'testuser');
    expect(response.body).toHaveProperty('email', 'testuser@example.com');
    expect(response.body).toHaveProperty('tipo', 'normal');
    expect(response.headers['set-cookie'][0]).toMatch(/token=.+/);
  });

  // User login test
  test('POST /api/auth/login should authenticate user and return token', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        direccion: '123 Test Street',
        tipo: 'normal',
        telefono: '1234567890'
      });

    // Validate input using Zod schema
    const validationResult = loginSchema.safeParse({
      email: 'testuser@example.com',
      password: 'password123'
    });

    // Ensure input passes validation
    expect(validationResult.success).toBe(true);

    // Send login request
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });
    
    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('username', 'testuser');
    expect(response.body).toHaveProperty('email', 'testuser@example.com');
    expect(response.headers['set-cookie'][0]).toMatch(/token=.+/);
  });

  // Duplicate email registration test
  test('POST /api/auth/register should not allow duplicate email', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'firstuser',
        email: 'testuser@example.com',
        password: 'password123',
        direccion: '123 Test Street',
        tipo: 'normal',
        telefono: '1234567890'
      });

    // Try to register with same email
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anotheruser',
        email: 'testuser@example.com', // Same email as previous test
        password: 'password123',
        direccion: '456 Test Avenue',
        tipo: 'normal',
        telefono: '0987654321'
      });
    
    // Assertions
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('El correo ya está en uso');
  });

  // Invalid login credentials test
  test('POST /api/auth/login should reject invalid credentials', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        direccion: '123 Test Street',
        tipo: 'normal',
        telefono: '1234567890'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword'
      });
    
    // Assertions
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('La contraseña es incorrecta');
  });
});