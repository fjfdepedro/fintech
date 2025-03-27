/*
  Warnings:

  - Added the required column `market_cap` to the `marketData` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `marketData` required. This step will fail if there are existing NULL values in that column.
  - Made the column `volume` on table `marketData` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "marketData" ADD COLUMN     "market_cap" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "volume" SET NOT NULL;
