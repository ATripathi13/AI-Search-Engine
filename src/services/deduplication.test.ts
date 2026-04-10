import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deduplicate, cosineSimilarity } from './deduplication';

describe('Deduplication', () => {
    describe('Property 9: Deduplication Threshold Enforcement', () => {
        it('ensures no two chunks in output possess semantic similarity >= threshold', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.string(),
                            composite_score: fc.double({ min: 0, max: 1, noNaN: true }),
                            embedding: fc.array(fc.double({ noNaN: true, min: -1, max: 1 }), { minLength: 3, maxLength: 3 })
                        }),
                        { minLength: 1, maxLength: 20 }
                    ),
                    fc.double({ min: 0.1, max: 0.99, noNaN: true }), // Threshold
                    (chunks, threshold) => {
                        const safeChunks = chunks.map(c => {
                            if (c.embedding.every(v => v === 0)) c.embedding[0] = 0.1;
                            return c;
                        });

                        const retained = deduplicate(safeChunks, threshold);

                        for (let i = 0; i < retained.length; i++) {
                            for (let j = i + 1; j < retained.length; j++) {
                                const sim = cosineSimilarity(retained[i].embedding, retained[j].embedding);
                                // Must use floating point leniency 
                                // Floating points can occasionally be marginally above the target mathematically 
                                expect(sim).toBeLessThan(threshold + 1e-6);
                            }
                        }
                    }
                )
            );
        });
    });
});
