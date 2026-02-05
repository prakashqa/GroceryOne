/**
 * UpdateOrderStatusDto Validation Tests
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateOrderStatusDto } from './update-order-status.dto';

describe('UpdateOrderStatusDto', () => {
  it('should accept status "confirmed"', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, { status: 'confirmed' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "processing"', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, { status: 'processing' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "out_for_delivery"', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, { status: 'out_for_delivery' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "delivered"', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, { status: 'delivered' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "cancelled"', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, { status: 'cancelled' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid status', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, { status: 'shipped' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('should reject missing status', async () => {
    const dto = plainToInstance(UpdateOrderStatusDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });
});
