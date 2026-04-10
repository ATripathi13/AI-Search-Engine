import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LLMReasoningService } from './llm-service';
import { PipelineMetrics } from '../types';

describe('LLM Reasoning Service', () => {
    describe('Property 17: Context Deduplication Before LLM Submission', () => {
        it('ensures no duplicate chunk IDs exist in the final submitted context list', () => {
            const llm = new LLMReasoningService();

            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({ id: fc.string(), text: fc.string() }),
                        { minLength: 1, maxLength: 100 }
                    ),
                    (chunks) => {
                        const unique = llm.deduplicateContext(chunks);
                        const ids = unique.map(u => u.id);
                        const setIds = new Set(ids);

                        expect(ids.length).toBe(setIds.size);
                    }
                )
            );
        });
    });

    describe('Property 16: Token Budget Enforcement', () => {
        it('limits assembled context strictly to the 8000 token limit', () => {
            const llm = new LLMReasoningService();

            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({ id: fc.string(), text: fc.string({ minLength: 100, maxLength: 5000 }) }),
                        { minLength: 10, maxLength: 50 }
                    ),
                    (chunks) => {
                        const metrics: PipelineMetrics = { stage_latencies: {}, hop_count: 0, model_selection: 'mock', estimated_cost: 0, token_counts: {} };

                        const ctx = llm.assembleContext(chunks, metrics);
                        const tokens = llm.estimateTokens(ctx);

                        expect(tokens).toBeLessThanOrEqual(llm.tokenBudgets.contextWindow);
                        expect(metrics.token_counts!.context_window!).toEqual(tokens);
                    }
                )
            );
        });
    });
});
