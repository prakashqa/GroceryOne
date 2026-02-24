/**
 * Generic mock repository factory for TypeORM Repository tests.
 */

import { createMockQueryBuilder } from './mock-query-builder';

export function createMockRepository(
  queryBuilderOverrides?: Partial<Record<string, jest.Mock>>,
) {
  const queryBuilder = createMockQueryBuilder(queryBuilderOverrides);
  return {
    create: jest.fn().mockImplementation((data) => data),
    save: jest
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({ id: 'mock-id', ...data }),
      ),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn(),
    softDelete: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
    _queryBuilder: queryBuilder,
  };
}
