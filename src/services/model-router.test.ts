import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ModelRouter, SupportedModel } from './model-router';
import { PipelineMetrics } from '../types';

describe('Model Router', () => {
    describe('Property 19: Model Router Validity', () => {
        it('always selects a supported model and correctly updates metrics', () => {
            const supportedModels = ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-5-haiku'];

            fc.assert(
                fc.property(
                    fc.double({ min: 0, max: 1, noNaN: true }), // complexity
                    fc.integer({ min: 10, max: 8000 }), // in tokens
                    fc.integer({ min: 10, max: 2000 }), // out tokens
                    fc.double({ min: 0.0001, max: 1.0, noNaN: true }), // budget
                    (complexity, inTokens, outTokens, budget) => {
                        const router = new ModelRouter({ defaultModel: 'claude-3-5-sonnet', budget });
                        const metrics: PipelineMetrics = { stage_latencies: {}, hop_count: 0, model_selection: 'none', estimated_cost: 0, token_counts: {} };

                        const model = router.route(complexity, inTokens, outTokens, metrics);

                        expect(supportedModels).toContain(model);
                        expect(metrics.model_selection).toBe(model);
                        expect(metrics.estimated_cost).toBeGreaterThanOrEqual(0);
                    }
                )
            );
        });
    });
});
