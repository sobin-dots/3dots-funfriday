import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Seed Admin
  const adminEmail = 'admin@3dots.co';
  const adminPassword = process.env.ADMIN_PASSWORD || 'funfriday';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.member.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      team: 'Facilitators',
    },
  });

  // 2. Seed Global GameState
  await prisma.gameState.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      phase: 'lobby',
    },
  });

  console.log('Admin and GameState seeded');


}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
