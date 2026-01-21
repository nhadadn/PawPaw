/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Limpiar base de datos (orden inverso de dependencias)
  // No borramos todo para respetar integridad si hubiera algo, pero como está vacía según chequeo,
  // vamos a asegurar idempotencia creando o actualizando (upsert).

  // 2. Crear Categorías
  const categories = [
    { name: 'Ropa', slug: 'ropa', description: 'Prendas urbanas de alta calidad' },
    { name: 'Accesorios', slug: 'accesorios', description: 'Complementos para tu estilo' },
    { name: 'Ediciones Limitadas', slug: 'limited', description: 'Drops exclusivos' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
  }
  console.log('Categorías creadas.');

  // Obtener referencias a categorías
  const ropaCat = await prisma.category.findUnique({ where: { slug: 'ropa' } });
  const accCat = await prisma.category.findUnique({ where: { slug: 'accesorios' } });

  if (!ropaCat || !accCat) throw new Error('Error recuperando categorías');

  // 3. Crear Productos
  const products = [
    {
      name: 'Camiseta Oversized PawPaw',
      slug: 'camiseta-oversized-pawpaw',
      description: 'Camiseta de algodón premium con corte oversized.',
      priceCents: 45000, // $450.00
      categoryId: ropaCat.id,
      variants: [
        { sku: 'TSHIRT-BLK-S', size: 'S', color: 'Negro', initialStock: 50 },
        { sku: 'TSHIRT-BLK-M', size: 'M', color: 'Negro', initialStock: 50 },
        { sku: 'TSHIRT-BLK-L', size: 'L', color: 'Negro', initialStock: 50 },
      ],
    },
    {
      name: 'Hoodie Essential',
      slug: 'hoodie-essential',
      description: 'Sudadera cómoda para el día a día.',
      priceCents: 85000, // $850.00
      categoryId: ropaCat.id,
      variants: [
        { sku: 'HOODIE-GRY-M', size: 'M', color: 'Gris', initialStock: 30 },
        { sku: 'HOODIE-GRY-L', size: 'L', color: 'Gris', initialStock: 30 },
      ],
    },
    {
      name: 'Gorra Trucker',
      slug: 'gorra-trucker',
      description: 'Estilo clásico con malla trasera.',
      priceCents: 35000, // $350.00
      categoryId: accCat.id,
      variants: [{ sku: 'CAP-TRUCK-01', size: 'Única', color: 'Negro/Blanco', initialStock: 100 }],
    },
  ];

  for (const prod of products) {
    const { variants, ...productData } = prod;

    const createdProduct = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    });

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {},
        create: {
          productId: createdProduct.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          initialStock: variant.initialStock,
          reservedStock: 0,
        },
      });
    }
  }
  console.log('Productos y variantes creados.');

  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
