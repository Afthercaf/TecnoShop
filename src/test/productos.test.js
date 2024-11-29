import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { Producto } from '../models/Productos.model.js';
import productoRoutes from '../routes/venderos.routes.js';

// Create the Express app and use the product routes
const app = express();
app.use(bodyParser.json());
app.use('/api', productoRoutes);

// Test Database Connection (Replace with your test DB URI)
const MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb';

// Create a mock `tiendaId` for testing
const tiendaIdMock = new mongoose.Types.ObjectId();

describe('Product API Tests', () => {
  // Setup before tests
  beforeAll(async () => {
    await mongoose.connect(MONGO_URI_TEST, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  // Clean up after tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  // Test GET /productos (Retrieve all products)
  test('GET /api/productos should return all products', async () => {
    // Create some test products with a valid `tiendaId`
    await Producto.create({
      nombre: 'Producto Test 1',
      precio: 100,
      cantidad: 10,
      categoria: 'Electrónica',
      imagenes: [],
      estado: 'activo',
      especificaciones: {},
      tiendaId: tiendaIdMock,
    });

    await Producto.create({
      nombre: 'Producto Test 2',
      precio: 150,
      cantidad: 5,
      categoria: 'Electrónica',
      imagenes: [],
      estado: 'activo',
      especificaciones: {},
      tiendaId: tiendaIdMock,
    });

    // Send the GET request to /productos
    const response = await request(app).get('/api/productos?tiendaId=' + tiendaIdMock);

    // Assertions
    expect(response.status).toBe(200); // Expecting a successful status code
    expect(response.body).toHaveLength(2); // Expecting 2 products in the response
    expect(response.body[0]).toHaveProperty('nombre', 'Producto Test 1');
    expect(response.body[1]).toHaveProperty('nombre', 'Producto Test 2');
  });

  // Test GET /producto (Retrieve a specific product)
  test('GET /api/producto should return a specific product', async () => {
    // Create a test product with a valid `tiendaId`
    const producto = await Producto.create({
      nombre,
      precio,
      cantidad,
      categoria,
      imagenes: [],
      estado,
      especificaciones: {},
      tiendaId: tiendaIdMock,
    });

    // Send GET request for that product by its ID
    const response = await request(app).get(`/api/producto?id=${producto._id}`);

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('nombre');
    expect(response.body).toHaveProperty('precio');
    expect(response.body).toHaveProperty('cantidad');
  });
});
