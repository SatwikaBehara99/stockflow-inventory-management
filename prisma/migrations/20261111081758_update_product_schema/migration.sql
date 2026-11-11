/*
  Warnings:

  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "category",
DROP COLUMN "price",
DROP COLUMN "quantity",
ADD COLUMN     "costPrice" DECIMAL(10,2),
ADD COLUMN     "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sellingPrice" DECIMAL(10,2);
