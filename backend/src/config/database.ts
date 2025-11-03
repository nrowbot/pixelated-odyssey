import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query"
    },
    {
      emit: "event",
      level: "error"
    },
    {
      emit: "event",
      level: "warn"
    }
  ]
});

prisma.$on("error", (event) => {
  console.error("Prisma error:", event);
});

prisma.$on("warn", (event) => {
  console.warn("Prisma warning:", event);
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
