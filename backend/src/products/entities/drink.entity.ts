import { ChildEntity, Column } from 'typeorm';
import { Product } from './product.entity';

@ChildEntity('Drink')
export class Drink extends Product {
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  volume: number;
}
