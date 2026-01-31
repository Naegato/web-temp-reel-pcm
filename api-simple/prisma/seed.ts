import { PrismaClient } from './generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: pool })

async function main() {
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.chat.deleteMany()
  await prisma.user.deleteMany()

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.test',
      password: '123',
      role: 'ADMIN',
      verified: true,
    },
  })

  const advisor1 = await prisma.user.create({
    data: {
      email: 'test2@test.test',
      password: '123',
      role: 'ADVISOR',
      verified: true,
    },
  })

  const advisor2 = await prisma.user.create({
    data: {
      email: 'test2@test2.test',
      password: '123',
      role: 'ADVISOR',
      verified: true,
    },
  })

  const user1 = await prisma.user.create({
    data: {
      email: 'test@test.test',
      password: '123',
      role: 'USER',
      verified: true,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'test@test2.test',
      password: '123',
      role: 'USER',
      verified: true,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'test@test3.test',
      password: '123',
      role: 'USER',
      verified: true,
    },
  })

  const globalChat = await prisma.chat.create({
    data: {
      type: 'GLOBAL_ADVISOR',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
