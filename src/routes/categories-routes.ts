import { z } from "zod";
import { CategoryController } from "../controllers/categories-controller.js";
import { FastifyTypedInstanc } from "../types/fastify.js";
import { requireAdminAuth } from "../middleware/adminauth-middleware.js";

const categoryController = new CategoryController();

export async function categoryRoutes(app: FastifyTypedInstanc) {
  app.get(
    "/category",
    {
      schema: {
        tags: ["Category"],
        description: "Lista as Categorias Disponíveis",
      },
    },
    (request, reply) => {
      return categoryController.listCategories(request, reply);
    },
  );

  app.delete(
    "/category/:id",
    {
      preHandler: requireAdminAuth,
      schema: {
        tags: ["Category"],
        description: "Deleção de Categorias",
        params: z.object({ id: z.uuid() }),
        response: {
          200: z.object({
            id: z.string(),
          }),
        },
      },
    },
    (request, reply) => categoryController.deleteCategory(request, reply),
  );

  app.patch(
    "/category/:id",
    {
      preHandler: requireAdminAuth,
      schema: {
        tags: ["Category"],
        description: "Atualiza uma Categoria",
        params: z.object({
          id: z.uuid(),
        }),
        body: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
        }),
        response: {
          200: z.object({
            id: z.string(),
          }),
        },
      },
    },
    (request, reply) => categoryController.updateCategory(request, reply),
  );

  app.post(
    "/category",
    {
      preHandler: requireAdminAuth,
      schema: {
        tags: ["Category"],
        description: "Criação de Categoria",
        body: z.object({
          name: z.string(),
          description: z.string(),
        }),
        response: {
          201: z.object({
            name: z.string(),
            description: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    categoryController.createCategory.bind(categoryController),
  );
}
