/*
  Warnings:

  - You are about to alter the column `date_arrivee` on the `reservation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to alter the column `date_depart` on the `reservation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `reservation` MODIFY `date_arrivee` DATETIME(3) NOT NULL,
    MODIFY `date_depart` DATETIME(3) NOT NULL;
