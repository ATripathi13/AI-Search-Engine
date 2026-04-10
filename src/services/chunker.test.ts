import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DocumentChunker } from './chunker';

describe('Document Chunker', () => {
    describe('Property 4: Chunking Token Range', () => {
        it('should produce chunks that are <= maxChunkTokens', () => {
            const chunker = new DocumentChunker({ minChunkTokens: 256, maxChunkTokens: 512, overlapTokens: 50 });

            fc.assert(
                fc.property(
                    fc.string({ maxLength: 5000 }), // ~1000 tokens possibly
                    (text) => {
                        const chunks = chunker.splitText(text);
                        for (const chunk of chunks) {
                            const tokenCount = chunker.countTokens(chunk);
                            expect(tokenCount).toBeLessThanOrEqual(512);
                        }
                    }
                )
            );
        });
    });
});
