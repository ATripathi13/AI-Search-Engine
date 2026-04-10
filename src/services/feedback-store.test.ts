import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FeedbackStore } from './feedback-store';

describe('Feedback Store', () => {
    describe('Property 18: Feedback Signal Schema Invariant', () => {
        it('safely recalibrates batch records cleanly normalizing summed components limits strictly to 1.0', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            query_hash: fc.string({ minLength: 1 }),
                            source_ids: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
                            signal_type: fc.constantFrom('click_through' as const, 'dwell_time' as const, 'follow_up_query' as const)
                        }),
                        { minLength: 100, maxLength: 300 } // Bounds ensure at least 1 batch threshold triggers
                    ),
                    (signals) => {
                        const store = new FeedbackStore({
                            semantic: 0.25, keyword: 0.25, authority: 0.25, recency: 0.25
                        });

                        for (const s of signals) {
                            store.addSignal(s);
                        }

                        // Checks accurate batch clearing metric functionality
                        const expectedRemaining = signals.length % 100;
                        expect(store.getSignalsCount()).toBe(expectedRemaining);

                        const weights = store.getWeights();
                        const sum = weights.semantic + weights.keyword + weights.authority + weights.recency;
                        expect(Math.abs(sum - 1.0)).toBeLessThan(1e-6);

                        expect(weights.semantic).toBeGreaterThan(0);
                        expect(weights.keyword).toBeGreaterThan(0);
                        expect(weights.authority).toBeGreaterThan(0);
                        expect(weights.recency).toBeGreaterThan(0);
                    }
                )
            );
        });
    });
});
