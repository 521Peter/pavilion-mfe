-- 创建枚举
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- 创建枚举
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- 创建表
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "roles" "UserRole"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
