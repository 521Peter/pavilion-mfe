import { ProviderFactory } from "./provider.factory";
import * as registeredBuilders from "./index";

void registeredBuilders;

describe("ProviderFactory", () => {
  it("keeps OpenAI and Ollama builders registered", () => {
    expect(ProviderFactory.getSupportedTypes()).toEqual(expect.arrayContaining(["openai", "ollama"]));
    expect(
      ProviderFactory.create({ type: "openai", apiKey: "sk-test" }, { modelName: "gpt-test" }).constructor.name
    ).toBe("ChatOpenAI");
    expect(
      ProviderFactory.create({ type: "ollama", baseUrl: "http://localhost:11434" }, { modelName: "qwen-test" })
        .constructor.name
    ).toBe("ChatOllama");
  });
});
