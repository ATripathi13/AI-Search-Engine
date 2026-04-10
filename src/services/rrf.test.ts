import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mergeRRF } from './rrf';

describe('Reciprocal Rank Fusion (RRF)', () => {
    describe('Property 5: RRF Score Correctness', () => {
        it('should correctly sum 1/(60+rank) metrics independent of list ordering', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.uniqueArray(fc.string({ minLength: 1 })), { minLength: 1, maxLength: 6 }),
                    (lists) => {
                        const results = mergeRRF(lists);

                        for (const res of results) {
                            let expectedScore = 0;
                            lists.forEach(list => {
                                const idx = list.indexOf(res.id);
                                if (idx !== -1) {
                                    expectedScore += 1 / (60 + idx + 1);
                                }
                            });
                            // Floating point fuzzy match
                            expect(Math.abs(res.score - expectedScore)).toBeLessThan(1e-9);
                        }
                    }
                )
            );
        });

        it('should prioritize items present in both lists higher than items in just one (all else equal)', () => {
            // Document A is top in both. Document B is second in both.
            // Document C is top in list 1, but doesn't exist in list 2.
            const list1 = ['A', 'C', 'B'];
            const list2 = ['A', 'B'];

            const results = mergeRRF([list1, list2]);
            const getScore = (id: string) => results.find(r => r.id === id)!.score;

            expect(getScore('A')).toBeGreaterThan(getScore('B'));

            // C is rank 2 in list1: 1/(60+2) = 1/62
            // B is rank 3 in list1 & rank 2 in list2: 1/(60+3) + 1/(60+2) = 1/63 + 1/62 
            expect(getScore('B')).toBeGreaterThan(getScore('C'));
        });
    });
});
