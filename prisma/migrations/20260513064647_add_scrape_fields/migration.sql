-- AlterTable
ALTER TABLE "ProductPrice" ADD COLUMN     "externalSku" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT;
