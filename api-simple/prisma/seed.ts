import { PrismaClient } from './generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: pool })

async function main() {
  console.log(`Start seeding ...`)

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.chat.deleteMany()
  await prisma.user.deleteMany()

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.test',
      password: '123',
      role: 'ADMIN',
      verified: true,
    },
  })
  console.log(`Created admin: ${admin.email}`)

  // Create advisors
  const advisor1 = await prisma.user.create({
    data: {
      email: 'test2@test.test',
      password: '123',
      role: 'ADVISOR',
      verified: true,
    },
  })
  console.log(`Created advisor: ${advisor1.email}`)

  const advisor2 = await prisma.user.create({
    data: {
      email: 'test2@test2.test',
      password: '123',
      role: 'ADVISOR',
      verified: true,
    },
  })
  console.log(`Created advisor: ${advisor2.email}`)

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'test@test.test',
      password: '123',
      role: 'USER',
      verified: true,
    },
  })
  console.log(`Created user: ${user1.email}`)

  const user2 = await prisma.user.create({
    data: {
      email: 'test@test2.test',
      password: '123',
      role: 'USER',
      verified: true,
    },
  })
  console.log(`Created user: ${user2.email}`)

  const user3 = await prisma.user.create({
    data: {
      email: 'test@test3.test',
      password: '123',
      role: 'USER',
      verified: true,
    },
  })
  console.log(`Created user: ${user3.email}`)

  // Create global advisor chat (no messages)
  const globalChat = await prisma.chat.create({
    data: {
      type: 'GLOBAL_ADVISOR',
    },
  })
  console.log(`Created global advisor chat: ${globalChat.id}`)

  console.log(`Seeding finished.`)
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
