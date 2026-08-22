-- 扩展现有 Pavilion 应用注册表以支持网关授权。
ALTER TABLE "applications"
    ADD COLUMN "allowed_models" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ALTER COLUMN "frontend_entry" SET DEFAULT '';

-- 创建表
CREATE TABLE "application_keys" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_keys_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "provider_credentials" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'api_key',
    "encrypted_payload" TEXT NOT NULL,
    "masked_hint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "model_deployments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT,
    "credential_id" TEXT,
    "upstream_model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "input_price_per_m" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "output_price_per_m" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_deployments_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "virtual_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_models_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "routing_policies" (
    "id" TEXT NOT NULL,
    "virtual_model_id" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'single',
    "request_timeout" INTEGER NOT NULL DEFAULT 60000,
    "max_retries" INTEGER NOT NULL DEFAULT 0,
    "circuit_failures" INTEGER NOT NULL DEFAULT 3,
    "circuit_cooldown" INTEGER NOT NULL DEFAULT 30000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_policies_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "route_targets" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "route_targets_pkey" PRIMARY KEY ("id")
);

-- 升级现有可变 Agent 定义，同时保留旧字段。
ALTER TABLE "agent_definitions"
    ADD COLUMN "current_version_id" TEXT,
    ALTER COLUMN "system_prompt" SET DEFAULT '',
    ALTER COLUMN "provider_id" SET DEFAULT '',
    ALTER COLUMN "model_id" SET DEFAULT '';

-- 创建表
CREATE TABLE "agent_versions" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "virtual_model_id" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "run_config" JSONB NOT NULL DEFAULT '{}',
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_versions_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "tool_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "input_schema" JSONB NOT NULL DEFAULT '{}',
    "config" JSONB NOT NULL DEFAULT '{}',
    "mcp_server_id" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_definitions_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "agent_tool_bindings" (
    "agent_version_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "approval_policy" TEXT NOT NULL DEFAULT 'never',
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "agent_tool_bindings_pkey" PRIMARY KEY ("agent_version_id","tool_id")
);

-- 创建表
CREATE TABLE "skill_versions" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "storage_uri" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_versions_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "agent_skill_bindings" (
    "agent_version_id" TEXT NOT NULL,
    "skill_version_id" TEXT NOT NULL,
    "selection_mode" TEXT NOT NULL DEFAULT 'fixed',

    CONSTRAINT "agent_skill_bindings_pkey" PRIMARY KEY ("agent_version_id","skill_version_id")
);

-- 创建表
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT,
    "application_id" TEXT,
    "agent_version_id" TEXT,
    "virtual_model_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "error" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "run_steps" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "error" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "run_steps_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "run_events" (
    "id" BIGSERIAL NOT NULL,
    "run_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_events_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "provider_attempts" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "run_id" TEXT,
    "deployment_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error_type" TEXT,
    "status_code" INTEGER,
    "ttft_ms" INTEGER,
    "latency_ms" INTEGER,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_attempts_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "run_id" TEXT,
    "user_id" TEXT,
    "application_id" TEXT,
    "virtual_model_id" TEXT,
    "deployment_id" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "reasoning_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "fallback_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- 创建表
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "request_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE UNIQUE INDEX "application_keys_key_hash_key" ON "application_keys"("key_hash");

-- 创建索引
CREATE INDEX "application_keys_application_id_isActive_idx" ON "application_keys"("application_id", "isActive");

-- 创建索引
CREATE INDEX "provider_credentials_provider_id_isActive_idx" ON "provider_credentials"("provider_id", "isActive");

-- 创建索引
CREATE UNIQUE INDEX "model_deployments_name_key" ON "model_deployments"("name");

-- 创建索引
CREATE INDEX "model_deployments_provider_id_isActive_idx" ON "model_deployments"("provider_id", "isActive");

-- 创建索引
CREATE UNIQUE INDEX "virtual_models_name_key" ON "virtual_models"("name");

-- 创建索引
CREATE UNIQUE INDEX "routing_policies_virtual_model_id_key" ON "routing_policies"("virtual_model_id");

-- 创建索引
CREATE INDEX "route_targets_policy_id_priority_idx" ON "route_targets"("policy_id", "priority");

-- 创建索引
CREATE UNIQUE INDEX "route_targets_policy_id_deployment_id_key" ON "route_targets"("policy_id", "deployment_id");

-- 创建索引
CREATE UNIQUE INDEX "agent_versions_agent_id_version_key" ON "agent_versions"("agent_id", "version");

-- 创建索引
CREATE UNIQUE INDEX "tool_definitions_name_key" ON "tool_definitions"("name");

-- 创建索引
CREATE UNIQUE INDEX "skill_versions_skill_id_version_key" ON "skill_versions"("skill_id", "version");

-- 创建索引
CREATE UNIQUE INDEX "skill_versions_skill_id_content_hash_key" ON "skill_versions"("skill_id", "content_hash");

-- 创建索引
CREATE UNIQUE INDEX "runs_request_id_key" ON "runs"("request_id");

-- 创建索引
CREATE INDEX "runs_user_id_created_at_idx" ON "runs"("user_id", "created_at");

-- 创建索引
CREATE INDEX "runs_application_id_created_at_idx" ON "runs"("application_id", "created_at");

-- 创建索引
CREATE UNIQUE INDEX "run_steps_run_id_sequence_key" ON "run_steps"("run_id", "sequence");

-- 创建索引
CREATE UNIQUE INDEX "run_events_run_id_sequence_key" ON "run_events"("run_id", "sequence");

-- 创建索引
CREATE INDEX "provider_attempts_request_id_attempt_idx" ON "provider_attempts"("request_id", "attempt");

-- 创建索引
CREATE INDEX "usage_records_created_at_idx" ON "usage_records"("created_at");

-- 创建索引
CREATE INDEX "usage_records_application_id_created_at_idx" ON "usage_records"("application_id", "created_at");

-- 创建索引
CREATE INDEX "usage_records_virtual_model_id_created_at_idx" ON "usage_records"("virtual_model_id", "created_at");

-- 创建索引
CREATE INDEX "audit_logs_resource_type_resource_id_created_at_idx" ON "audit_logs"("resource_type", "resource_id", "created_at");

-- 添加外键
ALTER TABLE "application_keys" ADD CONSTRAINT "application_keys_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "llm_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "model_deployments" ADD CONSTRAINT "model_deployments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "llm_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "model_deployments" ADD CONSTRAINT "model_deployments_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "routing_policies" ADD CONSTRAINT "routing_policies_virtual_model_id_fkey" FOREIGN KEY ("virtual_model_id") REFERENCES "virtual_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "route_targets" ADD CONSTRAINT "route_targets_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "routing_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "route_targets" ADD CONSTRAINT "route_targets_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "model_deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "tool_definitions" ADD CONSTRAINT "tool_definitions_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "mcp_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "agent_tool_bindings" ADD CONSTRAINT "agent_tool_bindings_agent_version_id_fkey" FOREIGN KEY ("agent_version_id") REFERENCES "agent_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "agent_tool_bindings" ADD CONSTRAINT "agent_tool_bindings_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tool_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "skill_versions" ADD CONSTRAINT "skill_versions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "agent_skill_bindings" ADD CONSTRAINT "agent_skill_bindings_agent_version_id_fkey" FOREIGN KEY ("agent_version_id") REFERENCES "agent_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "agent_skill_bindings" ADD CONSTRAINT "agent_skill_bindings_skill_version_id_fkey" FOREIGN KEY ("skill_version_id") REFERENCES "skill_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "runs" ADD CONSTRAINT "runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "runs" ADD CONSTRAINT "runs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "runs" ADD CONSTRAINT "runs_agent_version_id_fkey" FOREIGN KEY ("agent_version_id") REFERENCES "agent_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "runs" ADD CONSTRAINT "runs_virtual_model_id_fkey" FOREIGN KEY ("virtual_model_id") REFERENCES "virtual_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "run_events" ADD CONSTRAINT "run_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "provider_attempts" ADD CONSTRAINT "provider_attempts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "provider_attempts" ADD CONSTRAINT "provider_attempts_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "model_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_virtual_model_id_fkey" FOREIGN KEY ("virtual_model_id") REFERENCES "virtual_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "model_deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加外键
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
