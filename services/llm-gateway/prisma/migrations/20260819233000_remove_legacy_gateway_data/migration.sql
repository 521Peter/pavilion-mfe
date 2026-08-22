-- 提供商密钥仅存储在 provider_credentials 中。
ALTER TABLE "llm_providers" DROP COLUMN "apiKey";

-- Application 表表示 LLM 网关调用方，不是重复的前端注册表。
ALTER TABLE "applications"
    DROP COLUMN "frontend_entry",
    DROP COLUMN "routes",
    DROP COLUMN "backend_base_url",
    DROP COLUMN "backend_health_path",
    DROP COLUMN "keep_alive",
    DROP COLUMN "sort_order",
    DROP COLUMN "config";

-- Agent 行为归属于不可变的 agent_versions。
ALTER TABLE "agent_definitions"
    DROP COLUMN "system_prompt",
    DROP COLUMN "provider_id",
    DROP COLUMN "model_id",
    DROP COLUMN "knowledge_base_ids",
    DROP COLUMN "skill_names",
    DROP COLUMN "mcp_server_ids",
    DROP COLUMN "config";

-- 已迁移的知识库表从未提供运行时或 API，不属于网关范围。
DROP TABLE "knowledge_chunks";
DROP TABLE "knowledge_documents";
DROP TABLE "knowledge_bases";
