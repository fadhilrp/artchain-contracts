-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "consensus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "imageUris" TEXT[],
ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medium" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "metadataUri" TEXT,
ADD COLUMN     "year" TEXT,
ALTER COLUMN "isOriginal" SET DEFAULT true,
ALTER COLUMN "originalAuthor" DROP NOT NULL,
ALTER COLUMN "originalAuthor" DROP DEFAULT,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PendingArtwork" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "dateSubmitted" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "images" TEXT[],
    "description" TEXT NOT NULL,
    "additionalInfo" TEXT NOT NULL,
    "imageUris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadataUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingArtwork_pkey" PRIMARY KEY ("id")
);
