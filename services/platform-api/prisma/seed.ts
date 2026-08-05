import { PrismaClient } from '../generated/prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'

  const hashed = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashed,
      nickname: 'Administrator',
      status: 'ACTIVE',
      roles: ['ADMIN', 'USER'],
    },
  })

  console.log(`Seed complete: admin user "${adminUsername}" is ready.`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
