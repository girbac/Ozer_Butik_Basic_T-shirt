import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js geliştirme modunda hot reload her seferinde yeni bir client yaratmasın diye
// global üzerinde tekil örnek tutuyoruz. Aksi halde bağlantı havuzu tükeniyor.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. .env dosyanızı .env.example'a bakarak doldurun.",
    );
  }

  // Prisma 7 Postgres için sürücü adaptörü zorunlu.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
