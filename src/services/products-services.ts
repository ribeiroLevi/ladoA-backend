import { CreateProduct, UpdateProductDTO } from "../types/product.js";
import { prisma } from "../database/prisma.js";
import { deletePicture } from "../utils/picture.js";

export class ProductService {
  async executeCreateProduct({
    name,
    description,
    quantity,
    picture,
    price,
    category_id,
  }: CreateProduct) {
    const category = await prisma.categories.findUnique({
      where: {
        id: category_id,
      },
    });

    if (!category) {
      throw new Error("Category does not exist");
    }

    const tempProduct = await prisma.products.findUnique({
      where: {
        name,
      },
    });

    // Produto excluído (lógico) com o mesmo nome: volta a ser ativo com os dados novos
    if (tempProduct && !tempProduct.active) {
      const reactivatedProduct = await prisma.products.update({
        where: {
          id: tempProduct.id,
        },
        data: {
          description,
          quantity,
          picture,
          price,
          category_id,
          active: true,
        },
      });

      await deletePicture(tempProduct.picture);

      return reactivatedProduct;
    }

    if (tempProduct) {
      const updatedProduct = await prisma.products.update({
        where: {
          id: tempProduct.id,
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });

      return updatedProduct;
    }

    const product = await prisma.products.create({
      data: {
        name,
        description,
        quantity,
        picture,
        price,
        category_id,
      },
    });

    return product;
  }

  async findProduct(id: string) {
    const product = await prisma.products.findUnique({
      where: {
        id,
      },
    });

    if (!product || !product.active) {
      throw new Error("Product does not exist");
    }

    return {
      ...product,
      price: Number(product.price),
    };
  }

  async updateProduct(data: UpdateProductDTO, id: string) {
    const product = await prisma.products.findUnique({
      where: {
        id: id,
      },
    });

    if (!product || !product.active) {
      throw new Error("Product does not exist");
    }

    const updatedProduct = await prisma.products.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        picture: data.picture,
        price: data.price,
        category_id: data.category_id,
      },
    });

    // Foto trocada ou removida: apaga o arquivo antigo do disco
    if (data.picture !== undefined) {
      await deletePicture(product.picture);
    }

    return updatedProduct;
  }

  async executeList() {
    const productsDB = await prisma.products.findMany({
      where: {
        active: true,
      },
    });

    return productsDB.map((product) => ({
      ...product,
      price: Number(product.price),
    }));
  }

  async deleteProduct(id: string) {
    const product = await prisma.products.findUnique({
      where: {
        id,
      },
    });

    if (!product || !product.active) {
      throw new Error("Product does not exist");
    }

    // Exclusão lógica: o produto continua nas compras antigas
    await prisma.products.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }
}
