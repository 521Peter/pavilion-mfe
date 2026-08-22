-- 创建表
CREATE TABLE "mcp_servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "transport" TEXT NOT NULL,
    "command" TEXT,
    "args" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "env" JSONB NOT NULL DEFAULT '{}',
    "url" TEXT,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "timeout" INTEGER NOT NULL DEFAULT 60000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cachedTools" JSONB NOT NULL DEFAULT '[]',
    "lastSyncAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_servers_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE UNIQUE INDEX "mcp_servers_identifier_key" ON "mcp_servers"("identifier");
