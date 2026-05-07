-- CreateTable
CREATE TABLE "user_session_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL,
    "logoutAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_session_logs_userId_idx" ON "user_session_logs"("userId");

-- CreateIndex
CREATE INDEX "user_session_logs_businessId_idx" ON "user_session_logs"("businessId");

-- CreateIndex
CREATE INDEX "user_session_logs_loginAt_idx" ON "user_session_logs"("loginAt");

-- AddForeignKey
ALTER TABLE "user_session_logs" ADD CONSTRAINT "user_session_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session_logs" ADD CONSTRAINT "user_session_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
