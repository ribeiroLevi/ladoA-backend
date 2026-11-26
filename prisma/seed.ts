import "dotenv/config";

import argon2 from "argon2";
import { prisma } from "../src/database/prisma.js";

// Cria (ou atualiza) o administrador inicial com os dados do .env
async function seed() {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;

  if (!login || !password) {
    throw new Error("Defina ADMIN_LOGIN e ADMIN_PASSWORD no .env");
  }

  const passwordHash = await argon2.hash(password);

  const admin = await prisma.users.upsert({
    where: {
      login,
    },
    update: {
      password: passwordHash,
      adm: true,
    },
    create: {
      name: process.env.ADMIN_NAME ?? "Administrador",
      email: process.env.ADMIN_EMAIL ?? "admin@ladoa.com",
      address: process.env.ADMIN_ADDRESS ?? "-",
      login,
      password: passwordHash,
      adm: true,
    },
  });

  console.log(`Administrador pronto: ${admin.login}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
