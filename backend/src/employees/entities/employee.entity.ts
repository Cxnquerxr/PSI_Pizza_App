import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EmployeeOrder } from './employee-order.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  surname: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @OneToMany(() => EmployeeOrder, (employeeOrder) => employeeOrder.employee)
  employeeOrders: EmployeeOrder[];
}
