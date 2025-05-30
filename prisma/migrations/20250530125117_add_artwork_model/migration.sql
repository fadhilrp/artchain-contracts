-- CreateTable
CREATE TABLE "Artwork" (
    "id" SERIAL NOT NULL,
    "imageHash" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "isDuplicate" BOOLEAN NOT NULL,
    "consensus" BOOLEAN NOT NULL,
    "title" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);
