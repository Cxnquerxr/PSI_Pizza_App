import { ChildEntity, Column } from 'typeorm';
import { Product } from './product.entity';

@ChildEntity('Pizza')
export class Pizza extends Product {
  @Column({ type: 'varchar', length: 50, nullable: true })
  dough_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  size: string;
}
