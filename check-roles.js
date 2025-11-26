const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, role: true, id: true }
  });
  console.log('Current Users in DB:');
  console.table(users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
