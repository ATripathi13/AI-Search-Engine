import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { EmbeddingService } from './embedding-service';
import RedisMock from 'ioredis-mock';
import { Redis } from 'ioredis';

describe('Embedding Service', () => {
    describe('Property 3: Embedding Dimension Bounds', () => {
        it('should return dimensions between 384 and 1024 based on the model', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
                    fc.constantFrom('all-MiniLM-L6-v2' as const, 'text-embedding-3-small' as const),
                    async (texts, model) => {
                        const service = new EmbeddingService({ model, batchSize: 8 });
                        const embeddings = await service.getEmbeddings(texts);

                        expect(embeddings).toHaveLength(texts.length);
                        for (const emb of embeddings) {
                            expect(emb.length).toBeGreaterThanOrEqual(384);
                            expect(emb.length).toBeLessThanOrEqual(1024);
                        }
                    }
                )
            );
        });
    });

    describe('Property 20: Embedding Cache Hit Avoids Recomputation', () => {
        it('should load from cache when available instead of recomputing', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
                    async (texts) => {
                        const redis = new RedisMock() as unknown as Redis;
                        await redis.flushall();
                        const service = new EmbeddingService({ model: 'all-MiniLM-L6-v2', batchSize: 16, redisClient: redis });

                        // First request - should compute
                        const e1 = await service.getEmbeddings(texts);
                        const initialCalls = service.computeCalls;
                        expect(initialCalls).toBeGreaterThan(0);

                        // Second request - should hit cache
                        const e2 = await service.getEmbeddings(texts);
                        expect(service.computeCalls).toBe(initialCalls); // No new computations
                        expect(e2).toEqual(e1);
                    }
                )
            );
        });
    });
});
