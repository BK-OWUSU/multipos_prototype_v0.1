-- CreateIndex
CREATE INDEX "audit_logs_businessId_createdAt_idx" ON "audit_logs"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "businesses_slug_idx" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_isOnboarded_idx" ON "businesses"("isOnboarded");

-- CreateIndex
CREATE INDEX "products_businessId_name_idx" ON "products"("businessId", "name");

-- CreateIndex
CREATE INDEX "products_businessId_categoryId_idx" ON "products"("businessId", "categoryId");

-- CreateIndex
CREATE INDEX "sales_businessId_createdAt_idx" ON "sales"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_businessId_shopId_idx" ON "sales"("businessId", "shopId");

-- CreateIndex
CREATE INDEX "stock_logs_productId_createdAt_idx" ON "stock_logs"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_logs_businessId_userId_idx" ON "stock_logs"("businessId", "userId");
