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
        this.category = {
            findMany: async () => [],
            findUnique: async () => null,
        };
        this.webhookEvent = {
            findUnique: async () => null,
            create: async () => ({}),
            update: async () => ({}),
        };
        this.order = {
            findFirst: async () => null,
            create: async () => ({ id: BigInt(1), status: 'paid', totalCents: 100 }),
            update: async () => ({ id: BigInt(1) }),
        };
        this.orderItem = {
            findMany: async () => [],
        };
        this.productVariant = {
            update: async () => ({}),
            findUnique: async () => ({
                id: BigInt(1),
                initialStock: 10,
                reservedStock: 0,
                priceCents: 1000,
            }),
        };
        this.inventoryLog = {
            create: async () => ({}),
        };
        this.$connect = async () => { };
        this.$disconnect = async () => { };
        this.$queryRaw = async () => [1];
        this.$transaction = async (callback) => callback(this);
    }
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
const prisma = (useMock ? new MockPrisma() : new client_1.PrismaClient());
exports.default = prisma;
