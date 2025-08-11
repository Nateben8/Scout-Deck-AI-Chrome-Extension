import { PrismaClient } from '@prisma/client';

let prismaGlobal = globalThis.__scoutdeck_prisma__;

if (!prismaGlobal) {
  prismaGlobal = new PrismaClient();
  globalThis.__scoutdeck_prisma__ = prismaGlobal;
}

export const prisma = prismaGlobal; 