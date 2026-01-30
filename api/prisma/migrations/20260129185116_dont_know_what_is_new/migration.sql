/*
  Warnings:

  - You are about to drop the column `sentAt` on the `messages` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `chats` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "messages_chatId_sentAt_idx";

-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "subject" VARCHAR(100),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "sentAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");
