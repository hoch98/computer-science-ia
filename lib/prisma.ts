import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// use local DATABASE_URL if it exists in the environment otherwise fall back to Turso
const localUrl = process.env.DATABASE_URL;

const adapter = new PrismaLibSQL(
  localUrl
    ? { url: localUrl }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
);

const prisma = new PrismaClient({ adapter });

export default prisma;