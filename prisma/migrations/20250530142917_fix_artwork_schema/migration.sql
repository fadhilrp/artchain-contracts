-- First, drop the existing table and recreate it with the correct schema
DROP TABLE IF EXISTS "Artwork" CASCADE;

CREATE TABLE "Artwork" (
    "id" SERIAL PRIMARY KEY,
    "imageHash" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "consensusCount" INTEGER NOT NULL DEFAULT 0,
    "requiredValidators" INTEGER NOT NULL DEFAULT 2,
    "originalAuthor" TEXT NOT NULL DEFAULT '',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_imageHash_key" UNIQUE ("imageHash"); 