import { prisma } from "@/lib/db/prisma";
import { ensureCoreData } from "@/lib/db/seed";
import type { AppRole } from "@/lib/auth/jwt";
import type { LoginInput, RegisterInput } from "@/lib/validators/auth";

export type MockUserRecord = {
  id: string;
  role: AppRole;
  account: string;
  phone?: string;
  name: string;
  password: string;
};

function serializeUser(user: {
  id: string;
  role: AppRole;
  account: string | null;
  phone: string | null;
  name: string;
  passwordHash: string;
}): MockUserRecord {
  return {
    id: user.id,
    role: user.role,
    account: user.account ?? user.phone ?? user.id,
    phone: user.phone ?? undefined,
    name: user.name,
    password: user.passwordHash
  };
}

export async function registerPatient(input: RegisterInput) {
  await ensureCoreData();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phone: input.phone }, { account: input.phone }]
    }
  });

  if (existing) {
    throw new Error("PHONE_EXISTS");
  }

  const user = await prisma.user.create({
    data: {
      role: "patient",
      status: "active",
      account: input.phone,
      phone: input.phone,
      name: input.name,
      passwordHash: input.password
    }
  });

  return serializeUser(user);
}

export async function loginUser(input: LoginInput) {
  await ensureCoreData();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ account: input.account }, { phone: input.account }]
    }
  });

  if (!user || user.passwordHash !== input.password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date()
    }
  });

  return serializeUser(user);
}

export async function findUserById(id: string) {
  await ensureCoreData();

  const user = await prisma.user.findUnique({
    where: { id }
  });

  return user ? serializeUser(user) : null;
}
