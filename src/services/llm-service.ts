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
     * Mocks a Streaming SSE response returning tokens iteratively
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

        const responseStr = `This is a generated answer from ${model} for the query: ${query}. It uses strict citations based on context.`;

        if (!metrics.token_counts) metrics.token_counts = {};
        metrics.token_counts.generation = this.estimateTokens(responseStr);

        if (metrics.token_counts.generation > this.tokenBudgets.generation) {
            throw new Error("Generation budget exceeded");
        }

        const words = responseStr.split(' ');
        for (const word of words) {
            await new Promise(res => setTimeout(res, 10)); // Simulated network streaming latency
            yield word + ' ';
        }
    }
}
