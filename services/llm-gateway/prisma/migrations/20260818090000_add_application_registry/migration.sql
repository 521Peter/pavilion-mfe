CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "app_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frontend_entry" TEXT NOT NULL,
    "routes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "backend_base_url" TEXT,
    "backend_health_path" TEXT,
    "keep_alive" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "applications_app_code_key" ON "applications"("app_code");
