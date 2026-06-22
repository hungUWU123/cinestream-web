import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.movie.count();
  const users = await prisma.user.count();
  console.log(`Total Movies: ${count}`);
  console.log(`Total Users: ${users}`);
  
  const sample = await prisma.movie.findMany({
    take: 5,
    select: { name: true, createdAt: true }
  });
  console.log('Sample movies:', sample);
  
  await prisma.$disconnect();
}

main().catch(console.error);
