"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
class MockPrisma {
    constructor() {
        this.product = {
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
        this.category = {
            findMany: async () => [],
            findUnique: async () => null
        };
        this.$connect = async () => { };
        this.$disconnect = async () => { };
        this.$queryRaw = async () => [1];
    }
}
const useMock = process.env.NODE_ENV !== 'production';
// In a real scenario we might check for DB connection, but here we force mock if no DB 
// or just use mock for this environment.
// For now, I'll default to MockPrisma to allow the server to run without DB.
const prisma = (useMock ? new MockPrisma() : new client_1.PrismaClient());
exports.default = prisma;
