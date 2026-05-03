import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { OrderStatus } from '../src/orders/enums/order-status.enum';
import { io, Socket } from 'socket.io-client';
import { DatabaseModule } from '../src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let clientSocket: Socket;
  let serverUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(TypeOrmModule.forRoot({ 
        type: 'sqlite', 
        database: ':memory:', 
        entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
        synchronize: true 
      }))
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    
    // Seed product to avoid foreign key errors
    const dataSource = app.get(require('typeorm').DataSource);
    await dataSource.query(`INSERT INTO "products"("id", "name", "price", "type") VALUES (1, 'Test Pizza', 10.00, 'Pizza')`);

    await app.listen(0); // Listen on a random free port

    serverUrl = await app.getUrl();
    
    // Connect a mock WebSocket client
    clientSocket = io(serverUrl);
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => resolve());
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    await app.close();
  });

  it('/orders (POST) - should create order and emit websocket event', async () => {
    const payload = {
      items: [
        { product_id: 1, quantity: 2, unit_price: "10.00" }
      ]
    };

    // Setup listener for websocket
    const wsPromise = new Promise((resolve) => {
      clientSocket.once('order.created', (data) => {
        resolve(data);
      });
    });

    // Execute HTTP POST
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toEqual(OrderStatus.PENDING_PAYMENT);

    // Wait for the websocket event to arrive
    const wsData: any = await wsPromise;
    expect(wsData.order.id).toEqual(response.body.id);
    expect(wsData.status).toEqual(OrderStatus.PENDING_PAYMENT);
  });

  it('/orders/:id/status (PATCH) - should update status and emit websocket event', async () => {
    // 1. Create order first
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [{ product_id: 1, quantity: 1, unit_price: "5.00" }] })
      .expect(201);
    
    const orderId = createRes.body.id;

    // 2. Setup listener for websocket update
    const wsPromise = new Promise((resolve) => {
      clientSocket.once('order.updated', (data) => {
        resolve(data);
      });
    });

    // 3. Patch the status
    const updateRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .send({ status: OrderStatus.PAID })
      .expect(200);

    expect(updateRes.body.status).toEqual(OrderStatus.PAID);

    // 4. Verify websocket event
    const wsData: any = await wsPromise;
    expect(wsData.order.id).toEqual(orderId);
    expect(wsData.status).toEqual(OrderStatus.PAID);
  });

  it('/orders/:id/status (PATCH) - should reject invalid transition', async () => {
    // 1. Create order (Starts PENDING_PAYMENT)
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [{ product_id: 1, quantity: 1, unit_price: "5.00" }] })
      .expect(201);
    
    const orderId = createRes.body.id;

    // 2. Attempt to skip PAID and go directly to PREPARING
    const updateRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .send({ status: OrderStatus.PREPARING })
      .expect(400);

    expect(updateRes.body.message).toContain('Invalid state transition');
  });
});
