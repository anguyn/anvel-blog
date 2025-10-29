import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'admin@anvel.com',
      },
    },
  });
}

main()
  .then(() => console.log('Đã xoá tất cả User trừ admin@anvel.com'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
