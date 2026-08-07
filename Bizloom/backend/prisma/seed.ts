import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  const usersToSeed = [
    {
      name: 'Farhat Sarwar',
      email: 'admin@bizloom.com',
      password: 'Admin123!',
      role: Role.ADMIN,
    },
    {
      name: 'Sarah Manager',
      email: 'manager@bizloom.com',
      password: 'Manager123!',
      role: Role.MANAGER,
    },
    {
      name: 'John Employee',
      email: 'employee@bizloom.com',
      password: 'Employee123!',
      role: Role.EMPLOYEE,
    },
    {
      name: 'Alice Accountant',
      email: 'accountant@bizloom.com',
      password: 'Accountant123!',
      role: Role.ACCOUNTANT,
    },
  ];

  for (const user of usersToSeed) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });
    console.log(`Created user: ${createdUser.name} (${createdUser.role})`);
  }

  console.log('Database seeding finished.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
