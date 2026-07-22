
import { withAccelerate } from '@prisma/extension-accelerate'

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

let clientOptions = {}

// 1. Detect if we are in production with Turso
if (process.env.TURSO_AUTH_TOKEN) {
  // Pass the connection config directly to PrismaLibSql
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  })
  
  clientOptions = { adapter }
} else {
  // 2. Local fallback uses standard native SQLite engine
  // Prisma 7 reads DATABASE_URL="file:./dev.db" natively from your .env
}

// 3. Instantiate the client instance
const prisma = globalForPrisma.prisma || new PrismaClient(clientOptions).$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma