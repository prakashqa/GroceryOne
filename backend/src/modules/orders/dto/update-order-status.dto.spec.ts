/**
 * UpdateOrderStatusDto Validation Tests
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateOrderStatusDto } from './update-order-status.dto';

describe('UpdateOrderStatusDto', () => {
  test.each(['confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'])(
    'should accept status "%s"',
    async (status) => {
      const dto = plainToInstance(UpdateOrderStatusDto, { status });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    },
  );

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
