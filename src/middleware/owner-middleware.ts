import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../database/prisma.js";

// Permite a requisição só para o dono do cadastro (id da rota) ou para admin
export async function requireOwnerOrAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.session.userId;

  if (!userId) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  const { id } = request.params as { id: string };

  if (!user.adm && user.id !== id) {
    return reply.status(403).send({ message: "Forbidden" });
  }
}
