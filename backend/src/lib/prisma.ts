import { PrismaClient } from '@prisma/client';

class MockPrisma {
  product = {
    findMany: async () => {
      return [
        {
          id: BigInt(1),
          name: 'Mock Product',
          slug: 'mock-product',
          priceCents: 1000,
          isActive: true,
          category: { name: 'Mock Category' },
          variants: [{ initialStock: 10, reservedStock: 0, id: BigInt(1), productId: BigInt(1) }],
          images: []
        }
      ];
    },
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 1,
    create: async () => ({ id: BigInt(1) }),
    update: async () => ({ id: BigInt(1) })
  };
  category = {
    findMany: async () => [],
    findUnique: async () => null
  };
  $connect = async () => {};
  $disconnect = async () => {};
  $queryRaw = async () => [1];
}

const useMock = process.env.NODE_ENV !== 'production'; 
// In a real scenario we might check for DB connection, but here we force mock if no DB 
// or just use mock for this environment.
// For now, I'll default to MockPrisma to allow the server to run without DB.

const prisma = (useMock ? new MockPrisma() : new PrismaClient()) as unknown as PrismaClient;

export default prisma;
