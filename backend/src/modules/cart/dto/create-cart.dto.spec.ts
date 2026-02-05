/**
 * CreateCartDto Validation Tests
 * Ensures status enum accepts all valid CartStatus values
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCartDto } from './create-cart.dto';

describe('CreateCartDto', () => {
  const validDto = { name: 'Test Cart' };

  it('should accept status "draft"', async () => {
    const dto = plainToInstance(CreateCartDto, { ...validDto, status: 'draft' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "printed"', async () => {
    const dto = plainToInstance(CreateCartDto, { ...validDto, status: 'printed' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "paid"', async () => {
    const dto = plainToInstance(CreateCartDto, { ...validDto, status: 'paid' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept status "completed"', async () => {
    const dto = plainToInstance(CreateCartDto, { ...validDto, status: 'completed' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid status', async () => {
    const dto = plainToInstance(CreateCartDto, { ...validDto, status: 'invalid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('should accept missing status (optional)', async () => {
    const dto = plainToInstance(CreateCartDto, validDto);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
