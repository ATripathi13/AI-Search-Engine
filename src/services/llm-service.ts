import OpenAI from 'openai';
import { ModelRouter, SupportedModel } from './model-router';
import { PipelineMetrics } from '../types';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class LLMReasoningService {
    public readonly tokenBudgets = {
        decomposition: 500,
        contextWindow: 8000,
        generation: 2000
    };

    /**
     * Deduplicates chunk IDs to prevent context redundancy.
     */
    deduplicateContext(chunks: { id: string, text: string }[]): { id: string, text: string }[] {
        const seen = new Set<string>();
        const unique: { id: string, text: string }[] = [];

        for (const chunk of chunks) {
            if (!seen.has(chunk.id)) {
                seen.add(chunk.id);
                unique.push(chunk);
            }
        }

        return unique;
    }

    /**
     * Validates context token counts
     * Simple mock counting (approximate 4 chars = 1 token)
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Assembles context adhering strictly to the token budget limits.
     */
    assembleContext(chunks: { id: string, text: string }[], metrics: PipelineMetrics): string {
        const uniqueChunks = this.deduplicateContext(chunks);

        let context = "";
        let currentTokens = 0;

        for (const chunk of uniqueChunks) {
            const chunkText = `[ID: ${chunk.id}] ${chunk.text}\n\n`;
            const chunkTokens = this.estimateTokens(chunkText);

            if (currentTokens + chunkTokens <= this.tokenBudgets.contextWindow) {
                context += chunkText;
                currentTokens += chunkTokens;
            } else {
                break; // Budget exhausted, drop remaining chunks
            }
        }

        if (!metrics.token_counts) metrics.token_counts = {};
        metrics.token_counts.context_window = this.estimateTokens(context);

        return context;
    }

    /**
     * Integrates absolute native OpenAI APIs retrieving prompt boundaries actively natively.
     */
    async *generateStreamingResponse(
        query: string,
        context: string,
        model: SupportedModel,
        metrics: PipelineMetrics
    ): AsyncGenerator<string, void, unknown> {
        const systemPrompt = `You are a reasoning engine. Answer the query ONLY using the provided context:\n\n${context}`;

        if (this.estimateTokens(systemPrompt) > this.tokenBudgets.contextWindow) {
            throw new Error("Context window budget exceeded by system prompt structure");
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_KEY_HERE')) {
            throw new Error("Missing correct OPENAI_API_KEY mapping definitions inside .env constraints");
        }

        const openai = new OpenAI({ apiKey });
        const liveModel = model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4o-mini';

        const stream = await openai.chat.completions.create({
            model: liveModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            stream: true,
            max_tokens: this.tokenBudgets.generation
        });

        let generatedTokens = 0;

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                generatedTokens += this.estimateTokens(content);
                yield content;
            }
        }

        if (!metrics.token_counts) metrics.token_counts = {};
        metrics.token_counts.generation = generatedTokens;
    }
}
