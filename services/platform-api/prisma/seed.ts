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

  // ─── LLM Provider 种子数据 ───
  const providers = [
    {
      name: 'Ollama 本地',
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      apiKey: null,
      isActive: true,
      config: {},
      models: [
        { modelName: 'llama3.2', displayName: 'Llama 3.2', isActive: true, config: {} },
        { modelName: 'qwen2.5', displayName: 'Qwen 2.5', isActive: true, config: {} },
      ],
    },
    {
      name: 'OpenAI 兼容代理',
      type: 'openai',
      baseUrl: 'http://localhost:8080/v1',
      apiKey: 'sk-placeholder',
      isActive: true,
      config: {},
      models: [
        { modelName: 'gpt-4o', displayName: 'GPT-4o', isActive: true, config: {} },
        { modelName: 'gpt-4o-mini', displayName: 'GPT-4o mini', isActive: false, config: {} },
      ],
    },
  ]

  for (const p of providers) {
    const existing = await prisma.llmProvider.findFirst({
      where: { name: p.name, type: p.type },
    })
    const provider =
      existing ??
      (await prisma.llmProvider.create({
        data: {
          name: p.name,
          type: p.type,
          baseUrl: p.baseUrl,
          apiKey: p.apiKey,
          isActive: p.isActive,
          config: p.config,
        },
      }))
    for (const m of p.models) {
      await prisma.llmModel.upsert({
        where: {
          providerId_modelName: { providerId: provider.id, modelName: m.modelName },
        },
        update: { isActive: m.isActive },
        create: { providerId: provider.id, ...m },
      })
    }
  }
  console.log(`Seed complete: ${providers.length} LLM providers seeded.`)

  console.log(`Seed complete: admin user "${adminUsername}" is ready.`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
