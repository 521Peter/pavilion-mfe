import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
    const adminUsername = process.env.SEED_ADMIN_USERNAME;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!adminUsername || !adminPassword) {
        throw new Error('SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are required when seeding the database');
    }

    const hashed = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { username: adminUsername },
        update: {},
        create: {
            username: adminUsername,
            password: hashed,
            nickname: adminUsername,
            status: 'ACTIVE',
            roles: ['ADMIN', 'USER']
        }
    });

    await Promise.all([
        prisma.application.upsert({
            where: { code: 'main-app' },
            update: {},
            create: { code: 'main-app', name: 'Pavilion Main App' }
        }),
        prisma.application.upsert({
            where: { code: 'ai-chat' },
            update: {},
            create: { code: 'ai-chat', name: 'Pavilion AI Chat', allowedModels: [] }
        })
    ]);

    console.log('Seed complete.');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
