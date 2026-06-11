/**
 * Shared mock query builder factory for TypeORM createQueryBuilder() tests.
 */

export function createMockQueryBuilder(
  overrides?: Partial<Record<string, jest.Mock>>,
) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
    ...overrides,
  };
}
