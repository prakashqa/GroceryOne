/**
 * CreateCartDto Validation Tests
 * Ensures status enum accepts all valid CartStatus values
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCartDto } from './create-cart.dto';

describe('CreateCartDto', () => {
  const validDto = { name: 'Test Cart' };

  test.each(['draft', 'printed', 'paid', 'completed'])(
    'should accept status "%s"',
    async (status) => {
      const dto = plainToInstance(CreateCartDto, { ...validDto, status });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    },
  );

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
