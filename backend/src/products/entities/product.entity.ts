import { Entity, PrimaryGeneratedColumn, Column, TableInheritance } from 'typeorm';

@Entity('products')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // type column is automatically handled by TypeORM TableInheritance
}
