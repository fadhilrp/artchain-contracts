/*
  Warnings:

  - You are about to drop the column `consensus` on the `Artwork` table. All the data in the column will be lost.
  - You are about to drop the column `isDuplicate` on the `Artwork` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Artwork` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imageHash]` on the table `Artwork` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `consensusCount` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isOriginal` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAuthor` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredValidators` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Artwork` table without a default value. This is not possible if the table is not empty.
  - Added the required column `validated` to the `Artwork` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Artwork" DROP COLUMN "consensus",
DROP COLUMN "isDuplicate",
DROP COLUMN "metadata",
ADD COLUMN     "consensusCount" INTEGER NOT NULL,
ADD COLUMN     "isOriginal" BOOLEAN NOT NULL,
ADD COLUMN     "originalAuthor" TEXT NOT NULL,
ADD COLUMN     "requiredValidators" INTEGER NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validated" BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Artwork_imageHash_key" ON "Artwork"("imageHash");
