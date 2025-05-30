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
-- Drop existing columns if they exist
ALTER TABLE "Artwork" DROP COLUMN IF EXISTS "consensus";
ALTER TABLE "Artwork" DROP COLUMN IF EXISTS "isDuplicate";
ALTER TABLE "Artwork" DROP COLUMN IF EXISTS "metadata";

-- Add new columns
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "isOriginal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "consensusCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "requiredValidators" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "originalAuthor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Artwork" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add unique constraint to imageHash if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Artwork_imageHash_key'
    ) THEN
        ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_imageHash_key" UNIQUE ("imageHash");
    END IF;
END $$;
