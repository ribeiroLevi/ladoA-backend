import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Descobre a extensão pelos primeiros bytes do arquivo (só aceita imagens)
function getImageExtension(picture: Buffer) {
  const isJpg =
    picture[0] === 0xff && picture[1] === 0xd8 && picture[2] === 0xff;

  if (isJpg) {
    return "jpg";
  }

  const isPng = picture.subarray(0, 4).toString("hex") === "89504e47";

  if (isPng) {
    return "png";
  }

  const isWebp =
    picture.subarray(0, 4).toString("ascii") === "RIFF" &&
    picture.subarray(8, 12).toString("ascii") === "WEBP";

  if (isWebp) {
    return "webp";
  }

  return null;
}

export async function savePicture(picture: Buffer) {
  const extension = getImageExtension(picture);

  if (!extension) {
    throw new Error("Invalid image type");
  }

  const uploadDirectory = path.join(process.cwd(), "uploads", "products");

  await mkdir(uploadDirectory, {
    recursive: true,
  });

  const filename = `${crypto.randomUUID()}.${extension}`;

  await writeFile(path.join(uploadDirectory, filename), picture);

  return `/uploads/products/${filename}`;
}

export async function deletePicture(picturePath: string | null) {
  if (!picturePath?.startsWith("/uploads/products/")) {
    return;
  }

  await rm(path.join(process.cwd(), picturePath), {
    force: true,
  });
}
