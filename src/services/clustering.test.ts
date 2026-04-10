import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { agglomerativeClustering } from './clustering';

describe('Agglomerative Clustering', () => {
    describe('Property 10: Cluster Size Bound', () => {
        it('all produced clusters conform accurately to the max capacity limits', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.string(),
                            composite_score: fc.double({ min: 0, max: 1, noNaN: true }),
                            embedding: fc.array(fc.double({ min: 0.9, max: 1.0, noNaN: true }), { minLength: 3, maxLength: 3 })
                        }),
                        { minLength: 1, maxLength: 20 }
                    ),
                    fc.integer({ min: 1, max: 10 }),
                    (chunks, maxSize) => {
                        const safeChunks = chunks.map(c => {
                            if (c.embedding.every(v => v === 0)) c.embedding[0] = 0.1;
                            return c;
                        });

                        const clusters = agglomerativeClustering(safeChunks, maxSize);
                        for (const cluster of clusters) {
                            expect(cluster.length).toBeLessThanOrEqual(maxSize);
                            expect(cluster.length).toBeGreaterThan(0);
                        }

                        const originalIds = new Set(safeChunks.map(c => c.id));
                        const clusteredIds = new Set(clusters.flat().map(c => c.id));
                        expect(clusteredIds.size).toBe(originalIds.size);
                    }
                )
            );
        });
    });
});
