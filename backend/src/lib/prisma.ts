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
          images: [],
        },
      ];
    },
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 1,
    create: async () => ({ id: BigInt(1) }),
    update: async () => ({ id: BigInt(1) }),
  };
  category = {
    findMany: async () => [],
    findUnique: async () => null,
  };
  webhookEvent = {
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
  };
  order = {
    findFirst: async () => null,
    create: async () => ({ id: BigInt(1), status: 'paid', totalCents: 100 }),
    update: async () => ({ id: BigInt(1) }),
  };
  orderItem = {
    findMany: async () => [],
  };
  productVariant = {
    update: async () => ({}),
    findUnique: async () => ({
      id: BigInt(1),
      initialStock: 10,
      reservedStock: 0,
      priceCents: 1000,
    }),
  };
  inventoryLog = {
    create: async () => ({}),
  };
  $connect = async () => {};
  $disconnect = async () => {};
  $queryRaw = async () => [1];
  $transaction = async (callback: (prisma: MockPrisma) => Promise<unknown>) => callback(this);
}

const isDatabaseConfigured = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !isDatabaseConfigured) {
  throw new Error('DATABASE_URL is required in production');
}

const useMock = !isDatabaseConfigured && !isProduction;

if (useMock) {
  console.warn('Using in-memory Prisma Mock (development mode)');
}

const prisma = (useMock ? new MockPrisma() : new PrismaClient()) as unknown as PrismaClient;

export default prisma;
