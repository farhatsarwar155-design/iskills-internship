const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.systemLog.findMany({
    where: { action: 'UNAUTHORIZED_ACCESS' },
    orderBy: { timestamp: 'desc' },
    take: 20
  });
  const unique = [...new Set(logs.map(l => l.description))];
  console.log(JSON.stringify(unique, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
