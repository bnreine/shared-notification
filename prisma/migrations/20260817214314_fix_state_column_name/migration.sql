/*
  Warnings:

  - You are about to drop the column `stateHash` on the `OAuthState` table. All the data in the column will be lost.
  - Added the required column `state` to the `OAuthState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OAuthState" DROP COLUMN "stateHash",
ADD COLUMN     "state" TEXT NOT NULL;
