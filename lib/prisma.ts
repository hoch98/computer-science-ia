import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// 1. Correctly type the global object to hold the base PrismaClient
const globalForPrisma = globalThis as unknown as { prismaBase: PrismaClient }

let clientOptions = {}

if (process.env.TURSO_AUTH_TOKEN) {
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  })
  
  clientOptions = { adapter }
}

// 2. Instantiate and preserve the BASE client globally
const prismaBase = globalForPrisma.prismaBase || new PrismaClient(clientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaBase = prismaBase

// 3. Apply the extension to the singleton instance and export that instead
const prisma = prismaBase.$extends(withAccelerate())

export default prisma
