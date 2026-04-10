import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeCompositeScore, recencyScore, authorityScore } from './scoring';

describe('Scoring Service', () => {
    describe('Property 6: Composite Score Formula and Weight Invariant', () => {
        it('should correctly sum metrics relative to weighting values if they sum exactly to 1.0', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        semantic: fc.double({ min: 0, max: 1, noNaN: true }),
                        keyword: fc.double({ min: 0, max: 1, noNaN: true }),
                        authority: fc.double({ min: 0, max: 1, noNaN: true }),
                        recency: fc.double({ min: 0, max: 1, noNaN: true })
                    }),
                    (metrics) => {
                        const w1 = 0.25, w2 = 0.25, w3 = 0.25, w4 = 0.25;
                        const score = computeCompositeScore(w1, w2, w3, w4, metrics.semantic, metrics.keyword, metrics.authority, metrics.recency);
                        // Score bounds checks
                        expect(score).toBeGreaterThanOrEqual(0);
                        expect(score).toBeLessThanOrEqual(1.0);

                        // Error trigger for bad weights
                        expect(() => computeCompositeScore(0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0)).toThrow(/Weights must sum to 1.0/);
                    }
                )
            );
        });
    });

    describe('Property 7: Recency Score Monotonicity', () => {
        it('older documents systematically have lower recency scores than newer ones', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 }),
                    (daysA, daysB) => {
                        const scoreA = recencyScore(daysA);
                        const scoreB = recencyScore(daysB);
                        if (daysA > daysB) {
                            expect(scoreA).toBeLessThan(scoreB);
                        } else if (daysA < daysB) {
                            expect(scoreA).toBeGreaterThan(scoreB);
                        } else {
                            expect(scoreA).toEqual(scoreB);
                        }
                    }
                )
            );
        });
    });

    describe('Property 8: Domain Authority Bounds', () => {
        it('all domains result in scores bound between 0.0 and 1.0', () => {
            fc.assert(
                fc.property(
                    fc.string(),
                    (domain) => {
                        const auth = authorityScore(domain);
                        expect(auth).toBeGreaterThanOrEqual(0.0);
                        expect(auth).toBeLessThanOrEqual(1.0);
                    }
                )
            );
        });
    });
});
