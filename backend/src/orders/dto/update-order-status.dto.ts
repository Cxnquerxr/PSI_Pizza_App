import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus, {
    message: `status must be a valid enum value (${Object.values(OrderStatus).join(', ')})`,
  })
  status: OrderStatus;
}
