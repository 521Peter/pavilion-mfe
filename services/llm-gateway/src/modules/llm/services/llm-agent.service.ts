import { Injectable } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
    isAIMessage,
    type BaseMessage,
    type MessageContent
} from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import type { ChatMessage, ChatParams } from './llm-chat.service';
import { AgentToolService } from './agent-tool.service';
import { SkillSelectorService, type SelectedSkill } from './skill-selector.service';

const GRAPH_RECURSION_LIMIT = 20;

export interface AgentExecutionConfig {
    systemPrompt?: string;
    allowedToolNames?: ReadonlySet<string>;
    skills?: SelectedSkill[];
    maxSteps?: number;
    signal?: AbortSignal;
}

function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((message) => {
        switch (message.role) {
            case 'system':
                return new SystemMessage(message.content);
            case 'assistant':
                return new AIMessage(message.content);
            default:
                return new HumanMessage(message.content);
        }
    });
}

function contentText(content: MessageContent): string {
    if (typeof content === 'string') return content;
    return content
        .map((block) =>
            typeof block === 'string' ? block : 'text' in block && typeof block.text === 'string' ? block.text : ''
        )
        .join('');
}

function agentPrompt(skills: SelectedSkill[]): string {
    const base = [
        '你是 Pavilion AI Agent。请解决用户任务；需要外部能力时主动调用可用工具，并根据工具结果继续推理。',
        '不要声称执行了未实际调用的工具。工具失败时说明失败原因，必要时调整参数后重试。'
    ];
    if (skills.length === 0) return base.join('\n');

    const instructions = skills
        .map((skill) => `<skill name=${JSON.stringify(skill.name)}>\n${skill.skillMd}\n</skill>`)
        .join('\n\n');
    return [...base, '以下 Skill 已根据用户意图自动启用，请遵循其指令：', instructions].join('\n\n');
}

function invokeConfig(params: ChatParams): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    if (params.temperature !== undefined) config.temperature = params.temperature;
    if (params.maxTokens !== undefined) config.maxTokens = params.maxTokens;
    return config;
}

function toolOutputText(output: unknown): string {
    if (typeof output === 'string') return output;
    return JSON.stringify(output) ?? String(output);
}

@Injectable()
export class LlmAgentService {
    constructor(
        private readonly skillSelector: SkillSelectorService,
        private readonly agentToolService: AgentToolService
    ) {}

    async run(model: BaseChatModel, params: ChatParams, execution?: AgentExecutionConfig): Promise<string> {
        const graph = await this.createGraph(model, params, execution);
        const result = await graph.invoke(
            { messages: toLangChainMessages(params.messages) },
            { recursionLimit: execution?.maxSteps ?? GRAPH_RECURSION_LIMIT, signal: execution?.signal }
        );
        const finalMessage = [...result.messages].reverse().find(AIMessage.isInstance);
        return finalMessage ? contentText(finalMessage.content) : '';
    }

    async *stream(model: BaseChatModel, params: ChatParams, execution?: AgentExecutionConfig): AsyncGenerator<string> {
        const graph = await this.createGraph(model, params, execution);
        const stream = await graph.stream(
            { messages: toLangChainMessages(params.messages) },
            {
                streamMode: 'messages',
                recursionLimit: execution?.maxSteps ?? GRAPH_RECURSION_LIMIT,
                signal: execution?.signal
            }
        );

        const messageStream = stream as unknown as AsyncIterable<[BaseMessage, Record<string, unknown>]>;
        for await (const [message, metadata] of messageStream) {
            if (metadata.langgraph_node !== 'agent' || !isAIMessage(message)) continue;
            const text = contentText(message.content);
            if (text) yield text;
        }
    }

    private async createGraph(model: BaseChatModel, params: ChatParams, execution?: AgentExecutionConfig) {
        const [skills, tools] = await Promise.all([
            execution?.skills ?? this.skillSelector.select(model, params.messages),
            this.agentToolService.listActiveTools(execution?.allowedToolNames)
        ]);
        const runnableModel = this.bindTools(model, tools);
        const toolsByName = new Map(tools.map((currentTool) => [currentTool.name, currentTool]));
        const prompt = new SystemMessage([execution?.systemPrompt, agentPrompt(skills)].filter(Boolean).join('\n\n'));
        const config = invokeConfig(params);

        const callAgent = async (state: typeof MessagesAnnotation.State) => ({
            messages: [await runnableModel.invoke([prompt, ...state.messages], config)]
        });
        const route = (state: typeof MessagesAnnotation.State) => {
            const lastMessage = state.messages.at(-1);
            return lastMessage !== undefined && isAIMessage(lastMessage) && lastMessage.tool_calls?.length
                ? 'tools'
                : END;
        };
        const callTools = async (state: typeof MessagesAnnotation.State) => {
            const lastMessage = state.messages.at(-1);
            if (lastMessage === undefined || !isAIMessage(lastMessage)) return { messages: [] };

            const messages = await Promise.all(
                (lastMessage.tool_calls ?? []).map(async (call) => {
                    const selectedTool = toolsByName.get(call.name);
                    let content: string;
                    try {
                        content = selectedTool
                            ? toolOutputText(await selectedTool.invoke(call.args))
                            : `未找到工具: ${call.name}`;
                    } catch (error) {
                        content = `工具调用失败: ${error instanceof Error ? error.message : String(error)}`;
                    }
                    return new ToolMessage({
                        content,
                        tool_call_id: call.id ?? call.name,
                        name: call.name
                    });
                })
            );
            return { messages };
        };

        return new StateGraph(MessagesAnnotation)
            .addNode('agent', callAgent)
            .addNode('tools', callTools)
            .addEdge(START, 'agent')
            .addConditionalEdges('agent', route, { tools: 'tools', [END]: END })
            .addEdge('tools', 'agent')
            .compile();
    }

    private bindTools(model: BaseChatModel, tools: StructuredToolInterface[]): Runnable {
        if (tools.length === 0) return model;
        if (!model.bindTools) throw new Error('当前模型不支持工具调用，无法运行 Agent');
        return model.bindTools(tools);
    }
}
