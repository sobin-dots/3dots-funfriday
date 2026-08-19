-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "team" TEXT NOT NULL DEFAULT 'No team',
    "points" INTEGER NOT NULL DEFAULT 100,
    "quizScore" INTEGER NOT NULL DEFAULT 0,
    "connected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionItem" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentBid" INTEGER NOT NULL DEFAULT 0,
    "winningBid" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "winnerId" TEXT,

    CONSTRAINT "AuctionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "auctionItemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MythStatement" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "scored" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MythStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MythVote" (
    "id" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "mythStatementId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "MythVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogoItem" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "svg" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "options" TEXT[],
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "scored" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LogoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogoVote" (
    "id" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "logoItemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "LogoVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionPuzzle" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revealedCategories" TEXT[],

    CONSTRAINT "ConnectionPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "words" TEXT[],
    "connectionPuzzleId" TEXT NOT NULL,

    CONSTRAINT "ConnectionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolvedCategory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "connectionCategoryId" TEXT NOT NULL,

    CONSTRAINT "SolvedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "phase" TEXT NOT NULL DEFAULT 'lobby',
    "activeAuctionId" TEXT,
    "activeMythId" TEXT,
    "activeLogoId" TEXT,
    "activeConnectionId" TEXT,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionItem_no_key" ON "AuctionItem"("no");

-- CreateIndex
CREATE UNIQUE INDEX "MythStatement_no_key" ON "MythStatement"("no");

-- CreateIndex
CREATE UNIQUE INDEX "MythVote_mythStatementId_memberId_key" ON "MythVote"("mythStatementId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "LogoItem_no_key" ON "LogoItem"("no");

-- CreateIndex
CREATE UNIQUE INDEX "LogoVote_logoItemId_memberId_key" ON "LogoVote"("logoItemId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionPuzzle_no_key" ON "ConnectionPuzzle"("no");

-- CreateIndex
CREATE UNIQUE INDEX "SolvedCategory_memberId_connectionCategoryId_key" ON "SolvedCategory"("memberId", "connectionCategoryId");

-- AddForeignKey
ALTER TABLE "AuctionItem" ADD CONSTRAINT "AuctionItem_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_auctionItemId_fkey" FOREIGN KEY ("auctionItemId") REFERENCES "AuctionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythVote" ADD CONSTRAINT "MythVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MythVote" ADD CONSTRAINT "MythVote_mythStatementId_fkey" FOREIGN KEY ("mythStatementId") REFERENCES "MythStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoVote" ADD CONSTRAINT "LogoVote_logoItemId_fkey" FOREIGN KEY ("logoItemId") REFERENCES "LogoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoVote" ADD CONSTRAINT "LogoVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionCategory" ADD CONSTRAINT "ConnectionCategory_connectionPuzzleId_fkey" FOREIGN KEY ("connectionPuzzleId") REFERENCES "ConnectionPuzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedCategory" ADD CONSTRAINT "SolvedCategory_connectionCategoryId_fkey" FOREIGN KEY ("connectionCategoryId") REFERENCES "ConnectionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedCategory" ADD CONSTRAINT "SolvedCategory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
