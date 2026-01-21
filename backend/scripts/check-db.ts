/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to DB...');
    await prisma.$connect();
    console.log('Connected to DB');

    // Check if Product model exists and is accessible
    // Note: Adjust 'product' to match your schema model name (e.g., Product, products)
    // I'll assume 'product' based on previous context (createProduct)
    // Actually, schema usually has PascalCase 'Product' but client uses camelCase 'product'

    // Let's check a simple query
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Query result:', result);
  } catch (e) {
    console.error('DB Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
