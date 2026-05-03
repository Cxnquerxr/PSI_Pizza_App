import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // 1. Validate Input (already partially done by DTO ValidationPipe)
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Calculate total price
    const totalPrice = createOrderDto.items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price), 
      0
    );

    // Create order with items
    const order = this.ordersRepository.create({
      total_price: totalPrice,
      status: OrderStatus.PENDING_PAYMENT, // Set initial status
      items: createOrderDto.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        custom_note: item.custom_note,
      })),
    });

    const savedOrder = await this.ordersRepository.save(order);
    
    // Broadcast creation after successful DB commit
    this.eventsGateway.broadcastOrderCreated(savedOrder);
    
    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    return await this.ordersRepository.find({ relations: ['items'] });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({ 
      where: { id },
      relations: ['items', 'payments', 'employeeOrders']
    });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    
    // Enforce valid state transitions
    if (!this.isValidTransition(order.status as OrderStatus, newStatus)) {
      throw new BadRequestException(`Invalid state transition from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;
    const updatedOrder = await this.ordersRepository.save(order);

    // Broadcast status update after successful DB commit
    this.eventsGateway.broadcastOrderUpdated(updatedOrder);
    
    return updatedOrder;
  }


  /**
   * State Machine Transition Logic based on PDF:
   * PENDING_PAYMENT -> PAID (upon successful payment via UC-1)
   * PAID -> PREPARING (kitchen accepts order via UC-5)
   * PAID -> REJECTED (kitchen rejects order, triggers refund via UC-5)
   * PREPARING -> READY (cook finishes order via UC-5)
   * READY -> DELIVERED (order handed to customer via UC-5)
   * 
   * Edge cases handled:
   * - Cannot skip PAID state: Kitchen cannot cook an unpaid order (validation based on UC-4).
   * - Terminal states: Once DELIVERED or REJECTED, the order state cannot change.
   * - Same state transition: Prevent redundant API calls transitioning into the same state.
   */
  private isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    if (currentStatus === newStatus) return false;

    switch (currentStatus) {
      case OrderStatus.PENDING_PAYMENT:
        return newStatus === OrderStatus.PAID;
      case OrderStatus.PAID:
        return newStatus === OrderStatus.PREPARING || newStatus === OrderStatus.REJECTED;
      case OrderStatus.PREPARING:
        return newStatus === OrderStatus.READY;
      case OrderStatus.READY:
        return newStatus === OrderStatus.DELIVERED;
      case OrderStatus.DELIVERED:
      case OrderStatus.REJECTED:
        return false; // Terminal states
      default:
        return false;
    }
  }
}
