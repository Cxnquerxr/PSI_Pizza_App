import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { EventsGateway } from '../events/events.gateway';
import { OrderStatus } from './enums/order-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockOrderRepository = {
  create: jest.fn().mockImplementation((dto) => ({ id: Date.now(), ...dto })),
  save: jest.fn().mockImplementation((order) => Promise.resolve({ id: Date.now(), ...order })),
  findOne: jest.fn(),
};

const mockEventsGateway = {
  broadcastOrderCreated: jest.fn(),
  broadcastOrderUpdated: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order with initial PENDING_PAYMENT status and calculate total price', async () => {
      const createOrderDto = {
        items: [
          { product_id: 1, quantity: 2, unit_price: 10 },
          { product_id: 2, quantity: 1, unit_price: 5 },
        ],
      };

      const result = await service.create(createOrderDto);

      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockEventsGateway.broadcastOrderCreated).toHaveBeenCalledWith(result);
      
      expect(result.status).toEqual(OrderStatus.PENDING_PAYMENT);
      expect(result.total_price).toEqual(25); // (2*10) + (1*5)
    });

    it('should throw BadRequestException if no items are provided', async () => {
      await expect(service.create({ items: [] })).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus state machine', () => {
    it('should allow valid transition from PENDING_PAYMENT to PAID', async () => {
      mockOrderRepository.findOne.mockResolvedValueOnce({ id: 1, status: OrderStatus.PENDING_PAYMENT });
      
      const result = await service.updateStatus(1, OrderStatus.PAID);
      
      expect(result.status).toEqual(OrderStatus.PAID);
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockEventsGateway.broadcastOrderUpdated).toHaveBeenCalledWith(result);
    });

    it('should allow valid transition from PAID to PREPARING', async () => {
      mockOrderRepository.findOne.mockResolvedValueOnce({ id: 1, status: OrderStatus.PAID });
      const result = await service.updateStatus(1, OrderStatus.PREPARING);
      expect(result.status).toEqual(OrderStatus.PREPARING);
    });

    it('should reject invalid transition skipping PAID (PENDING_PAYMENT -> PREPARING)', async () => {
      mockOrderRepository.findOne.mockResolvedValueOnce({ id: 1, status: OrderStatus.PENDING_PAYMENT });
      
      await expect(service.updateStatus(1, OrderStatus.PREPARING)).rejects.toThrow(BadRequestException);
      expect(mockEventsGateway.broadcastOrderUpdated).not.toHaveBeenCalled();
    });

    it('should reject transitions from terminal state DELIVERED', async () => {
      mockOrderRepository.findOne.mockResolvedValueOnce({ id: 1, status: OrderStatus.DELIVERED });
      
      await expect(service.updateStatus(1, OrderStatus.READY)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockOrderRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.updateStatus(999, OrderStatus.PAID)).rejects.toThrow(NotFoundException);
    });
  });
});
