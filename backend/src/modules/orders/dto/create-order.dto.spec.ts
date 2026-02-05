/**
 * CreateOrderDto Validation Tests
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from './create-order.dto';

describe('CreateOrderDto', () => {
  it('should accept valid cartId', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      cartId: '550e8400-e29b-41d4-a716-446655440000',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject missing cartId', async () => {
    const dto = plainToInstance(CreateOrderDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cartId');
  });

  it('should reject non-UUID cartId', async () => {
    const dto = plainToInstance(CreateOrderDto, { cartId: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cartId');
  });

  it('should accept optional notes', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      cartId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Please deliver to back door',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept missing notes (optional)', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      cartId: '550e8400-e29b-41d4-a716-446655440000',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject notes longer than 500 characters', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      cartId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'x'.repeat(501),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('notes');
  });
});
