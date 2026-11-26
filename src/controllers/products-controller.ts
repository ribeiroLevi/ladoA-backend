import { FastifyReply, FastifyRequest } from "fastify";
import { ProductService } from "../services/products-services.js";
import {
  CreateProduct,
  DeleteProductParams,
  FindProductParams,
  PatchProductsParams,
  UpdateProductBody,
} from "../types/product.js";
import { deletePicture, savePicture } from "../utils/picture.js";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    const { name, description, quantity, price, category_id, picture } =
      request.body as {
        name: string;
        description: string;
        quantity: number;
        price: number;
        category_id: string;
        picture: Buffer;
      };

    let picturePath: string | undefined;

    try {
      picturePath = await savePicture(picture);

      const product = await this.productService.executeCreateProduct({
        name,
        description,
        quantity,
        price,
        category_id,
        picture: picturePath,
      });

      // Nome já existente: só somou a quantidade, então a foto nova não é usada
      if (product.picture !== picturePath) {
        await deletePicture(picturePath);
      }

      return reply.status(201).send(product);
    } catch (error) {
      if (picturePath) {
        await deletePicture(picturePath);
      }

      if (error instanceof Error && error.message == "Invalid image type") {
        return reply.status(400).send({ message: error.message });
      }

      if (error instanceof Error && error.message == "Category does not exist") {
        return reply.status(404).send({ message: error.message });
      }

      return reply.status(500).send({ message: "Internal Server Error" });
    }
  }

  async listProducts(reply: FastifyReply) {
    const products = await this.productService.executeList();
    return reply.status(200).send(products);
  }

  async findProduct(
    request: FastifyRequest<{ Params: FindProductParams }>,
    reply: FastifyReply,
  ) {
    try {
      const data = request.params;
      const product = await this.productService.findProduct(data.id);
      return reply.status(200).send(product);
    } catch (error) {
      if (error instanceof Error && error.message == "Product does not exist") {
        return reply.status(404).send({
          message: error.message,
        });
      }
      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  }

  async updateProduct(
    request: FastifyRequest<{
      Body: UpdateProductBody;
      Params: PatchProductsParams;
    }>,
    reply: FastifyReply,
  ) {
    let picturePath: string | null | undefined;

    try {
      const { picture, remove_picture, ...data } = request.body;
      const params = request.params;

      if (remove_picture === "true") {
        picturePath = null;
      }

      if (picture && picture.length > 0) {
        picturePath = await savePicture(picture);
      }

      await this.productService.updateProduct(
        { ...data, picture: picturePath },
        params.id,
      );

      return reply.status(200).send("Product Updated Sucessfully");
    } catch (error) {
      if (picturePath) {
        await deletePicture(picturePath);
      }

      if (error instanceof Error && error.message == "Invalid image type") {
        return reply.status(400).send({ message: error.message });
      }

      if (error instanceof Error && error.message == "Product does not exist") {
        return reply.status(404).send({
          message: error.message,
        });
      }
      console.log(error);
      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  }

  async deleteProduct(
    request: FastifyRequest<{ Params: DeleteProductParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      await this.productService.deleteProduct(id);
      return reply.status(200).send("Product Deleted Sucessfully");
    } catch (error) {
      if (error instanceof Error && error.message == "Product does not exist") {
        return reply.status(404).send({
          message: error.message,
        });
      }

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  }
}
