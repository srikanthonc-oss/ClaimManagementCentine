import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@nttdata.com' },
    update: {},
    create: {
      email: 'admin@nttdata.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      platforms: ['Facet', 'Amisys', 'Xcelys'],
      isActive: true,
    },
  })

  // Create default routing thresholds
  await prisma.routingThreshold.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      autoResolve: 92,
      hitlLow: 60,
    },
  })

  console.log('Seed completed: admin user and default thresholds created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
