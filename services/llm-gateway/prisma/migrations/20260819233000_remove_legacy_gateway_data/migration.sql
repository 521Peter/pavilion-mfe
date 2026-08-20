-- Provider secrets are stored only in provider_credentials.
ALTER TABLE "llm_providers" DROP COLUMN "apiKey";

-- Application is an LLM gateway caller, not a duplicate frontend registry.
ALTER TABLE "applications"
    DROP COLUMN "frontend_entry",
    DROP COLUMN "routes",
    DROP COLUMN "backend_base_url",
    DROP COLUMN "backend_health_path",
    DROP COLUMN "keep_alive",
    DROP COLUMN "sort_order",
    DROP COLUMN "config";

-- Agent behavior belongs to immutable agent_versions.
ALTER TABLE "agent_definitions"
    DROP COLUMN "system_prompt",
    DROP COLUMN "provider_id",
    DROP COLUMN "model_id",
    DROP COLUMN "knowledge_base_ids",
    DROP COLUMN "skill_names",
    DROP COLUMN "mcp_server_ids",
    DROP COLUMN "config";

-- The migrated knowledge tables never had a runtime or API and are outside the gateway scope.
DROP TABLE "knowledge_chunks";
DROP TABLE "knowledge_documents";
DROP TABLE "knowledge_bases";
