import argon2 from "argon2";
import { CreateUserDTO, UpdateUserDTO } from "../types/user.js";

import { prisma } from "../database/prisma.js";
export class UserService {
  async executeCreate({
    name,
    email,
    address,
    adm,
    login,
    password,
  }: CreateUserDTO) {
    const tempUser = await prisma.users.findFirst({
      where: {
        OR: [{ email }, { login }],
      },
    });

    if (tempUser) {
      if (tempUser.email == email) {
        throw new Error("Email already in use");
      } else if (tempUser.login === login) {
        throw new Error("Username already in use");
      } else {
        throw new Error("User already exists");
      }
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        address,
        adm: false,
        login,
        password: passwordHash,
      },
    });

    return user;
  }

  async executeList() {
    const users2 = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        login: true,
        adm: true,
      },
    });
    return users2;
  }

  async executeDelete(id: string) {
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error("User does not exist");
    }

    await prisma.users.delete({
      where: {
        id,
      },
    });
  }

  async findUser(id: string) {
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        login: true,
        adm: true,
      },
    });

    if (!user) {
      throw new Error("User does not exist");
    }

    return user;
  }

  async updateUser(data: UpdateUserDTO, id: string) {
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error("User does not exist");
    }

    // E-mail ou login já usados por outra conta
    if (data.email) {
      const emailUser = await prisma.users.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (emailUser) {
        throw new Error("Email already in use");
      }
    }

    if (data.login) {
      const loginUser = await prisma.users.findFirst({
        where: {
          login: data.login,
          NOT: { id },
        },
      });

      if (loginUser) {
        throw new Error("Username already in use");
      }
    }

    let passwordHash: string | undefined;

    if (data.password) {
      passwordHash = await argon2.hash(data.password);
    }

    const updatedUser = await prisma.users.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        login: data.login,
        password: passwordHash,
      },
    });

    return updatedUser;
  }
}
