import { registerProviderBuilder } from './provider.registry';
import { OpenAIAdapterBuilder } from './openai.adapter';
import { OllamaAdapterBuilder } from './ollama.adapter';

// 模块加载时自动注册所有内置 Provider Adapter Builder
registerProviderBuilder(new OpenAIAdapterBuilder());
registerProviderBuilder(new OllamaAdapterBuilder());
