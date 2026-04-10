import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { precisionAtK, recallAtK, meanReciprocalRank, ndcgAtK } from './eval-metrics';

describe('Evaluation Metrics', () => {
    describe('Property 20: Ranking Metric Bounds', () => {
        it('ensures Precision@K, Recall@K, MRR, and NDCG@K always resolve mathematically tightly bound to arrays mapping exclusively inside strict [0.0, 1.0] definitions natively', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string(), { minLength: 1, maxLength: 50 }),
                    fc.array(fc.string(), { minLength: 1, maxLength: 50 }),
                    fc.integer({ min: 1, max: 20 }),
                    (retrieved, relevantArr, k) => {
                        const relevant = new Set(relevantArr);

                        const pAtK = precisionAtK(retrieved, relevant, k);
                        const rAtK = recallAtK(retrieved, relevant, k);
                        const mrr = meanReciprocalRank(retrieved, relevant);
                        const ndcg = ndcgAtK(retrieved, relevant, k);

                        expect(pAtK).toBeGreaterThanOrEqual(0.0);
                        expect(pAtK).toBeLessThanOrEqual(1.0);

                        expect(rAtK).toBeGreaterThanOrEqual(0.0);
                        expect(rAtK).toBeLessThanOrEqual(1.0);

                        expect(mrr).toBeGreaterThanOrEqual(0.0);
                        expect(mrr).toBeLessThanOrEqual(1.0);

                        expect(ndcg).toBeGreaterThanOrEqual(0.0);
                        // Accommodated minute JavaScript float accuracy overflow
                        expect(ndcg).toBeLessThanOrEqual(1.0 + 1e-6);
                    }
                )
            );
        });
    });
});
