import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Product } from '../products/entities/product.entity';
import { Pizza } from '../products/entities/pizza.entity';
import { Drink } from '../products/entities/drink.entity';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeOrder } from '../employees/entities/employee-order.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: 'FuwaFuwaTime', //process.env.DB_PASSWORD || 'FuwaFuwaTime',
  database: process.env.DB_NAME || 'pizzeria',
  entities: [Order, OrderItem, Payment, Product, Pizza, Drink, Employee, EmployeeOrder],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false, // Migrations should be used
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
