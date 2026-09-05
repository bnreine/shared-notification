/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider,providerAccountId]` on the table `OAuthConnection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "userId_provider_providerAccountId_unique" ON "OAuthConnection"("userId", "provider", "providerAccountId");
