import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  paid_sum: number;

  @Column({ type: 'varchar', length: 50 })
  payment_state: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // e.g., 'CARD', 'CASH'

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
