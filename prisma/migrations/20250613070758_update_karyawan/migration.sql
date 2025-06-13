/*
  Warnings:

  - You are about to drop the column `nip` on the `karyawan` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Karyawan_nip_key` ON `karyawan`;

-- AlterTable
ALTER TABLE `karyawan` DROP COLUMN `nip`;
