import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('employee_orders')
export class EmployeeOrder {
  // The DB table uses order_id as the primary key (one row per order).
  @PrimaryColumn({ name: 'order_id', type: 'int' })
  order_id: number;

  @Column({ type: 'int', nullable: true })
  cook_id: number;

  @Column({ type: 'int', nullable: true })
  waiter_id: number;

  @ManyToOne(() => Order, (order) => order.employeeOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Employee, (employee) => employee.employeeOrders, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cook_id' })
  cook: Employee;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'waiter_id' })
  waiter: Employee;
}
