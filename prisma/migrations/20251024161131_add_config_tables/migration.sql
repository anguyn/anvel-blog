/*
  Warnings:

  - You are about to drop the `SystemConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ConfigType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DURATION');

-- DropTable
DROP TABLE "public"."SystemConfig";

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "ConfigType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_histories" (
    "id" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "percentage" INTEGER NOT NULL DEFAULT 100,
    "rules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_metadata" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT[],
    "themeColor" TEXT NOT NULL DEFAULT '#000000',
    "bgColor" TEXT NOT NULL DEFAULT '#ffffff',
    "iconUrl" TEXT,
    "logoUrl" TEXT,
    "manifest" JSONB,
    "seo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");

-- CreateIndex
CREATE INDEX "system_configs_isPublic_idx" ON "system_configs"("isPublic");

-- CreateIndex
CREATE INDEX "config_histories_configKey_idx" ON "config_histories"("configKey");

-- CreateIndex
CREATE INDEX "config_histories_createdAt_idx" ON "config_histories"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "app_metadata_locale_key" ON "app_metadata"("locale");
