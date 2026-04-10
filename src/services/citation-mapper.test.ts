import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CitationMapper, SourceChunk } from './citation-mapper';
import { Claim } from './answer-validator';

describe('Citation Mapper', () => {
    describe('Property 15: Citation Structure Completeness', () => {
        it('ensures each valid claim receives a complete Citation object and marker', () => {
            const mapper = new CitationMapper();

            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 5, maxLength: 20 })).filter(arr => arr.length > 0 && new Set(arr).size === arr.length),
                    (claimTexts) => {
                        const answerText = claimTexts.join('. ') + '.';
                        const validClaims: Claim[] = claimTexts.map(t => ({ text: t, embedding: [1, 0, 0] }));

                        const sourceChunks: SourceChunk[] = [
                            { id: 'c1', source_id: 's1', text: 'SRC1', embedding: [1, 0, 0] },
                            { id: 'c2', source_id: 's2', text: 'SRC2', embedding: [0.9, 0.1, 0] },
                            { id: 'c3', source_id: 's3', text: 'SRC3', embedding: [0, 1, 0] }
                        ];

                        const { annotatedAnswer, citations } = mapper.mapCitations(answerText, validClaims, sourceChunks);

                        expect(citations.length).toBe(validClaims.length);

                        for (let i = 0; i < citations.length; i++) {
                            const c = citations[i];
                            expect(c.claim_span).toBe(validClaims[i].text);
                            expect(c.source_ids.length).toBeGreaterThan(0);
                            expect(c.chunk_texts.length).toBeGreaterThan(0);
                            expect(c.source_ids.length).toBeLessThanOrEqual(3);
                            expect(c.confidence).toBeGreaterThan(0);

                            expect(annotatedAnswer).toContain(`[${i + 1}]`);
                        }
                    }
                )
            );
        });
    });
});
