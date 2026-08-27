import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { SkillService } from "@/modules/skill/services/skill.service";
import { SkillSelectorService } from "./skill-selector.service";

describe("SkillSelectorService", () => {
  const messages = [{ role: "user" as const, content: "你好" }];
  const availableSkill = {
    name: "test-skill",
    description: "测试 Skill",
    source: "local",
    repoOwner: null,
    repoName: null,
    isActive: true,
    fileCount: 1,
    contentHash: null
  };

  it("模型调用失败时立即向上抛出，避免使用同一失效模型再次聊天", async () => {
    const error = new Error("401 Model DeepSeek V4 Flash is not supported");
    const skillService = {
      list: jest.fn().mockResolvedValue([availableSkill])
    } as unknown as SkillService;
    const invoke = jest.fn().mockRejectedValue(error);
    const model = {
      invoke
    } as unknown as BaseChatModel;

    await expect(new SkillSelectorService(skillService).select(model, messages)).rejects.toBe(error);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("Skill 目录加载失败时仍回退为普通聊天", async () => {
    const skillService = {
      list: jest.fn().mockRejectedValue(new Error("目录不可用"))
    } as unknown as SkillService;
    const invoke = jest.fn();
    const model = { invoke } as unknown as BaseChatModel;

    await expect(new SkillSelectorService(skillService).select(model, messages)).resolves.toEqual([]);
    expect(invoke).not.toHaveBeenCalled();
  });
});
