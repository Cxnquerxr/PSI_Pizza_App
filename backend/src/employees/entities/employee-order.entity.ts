import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('employee_orders')
export class EmployeeOrder {
  // Using composite primary key approach or separate surrogate key
  // We'll use composite key to represent the N:M table with attributes
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
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
  employee: Employee; // Wait, we have two roles. Let's make it simpler: map 'cook_id' and 'waiter_id' directly to Employee

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'waiter_id' })
  waiter: Employee;

  // The diagram had `cook_id`, `order_id`, `waiter_id` on `EmployeeOrder`.
  // To match it properly:
  // employee property maps to cook, waiter property maps to waiter.
}
