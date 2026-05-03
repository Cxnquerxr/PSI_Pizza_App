import { IsArray, ValidateNested, IsInt, Min, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt()
  product_id: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsOptional()
  @IsString()
  custom_note?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // total_price will be calculated by the backend based on items
}
