import { Citation } from '../types';
import { Claim } from './answer-validator';
import { cosineSimilarity } from './deduplication';

export interface SourceChunk {
    id: string;
    source_id: string;
    text: string;
    embedding: number[];
}

export class CitationMapper {
    /**
     * Maps claims to top-3 supporting chunks and appends inline markers in answer text.
     */
    mapCitations(answerText: string, validClaims: Claim[], sourceChunks: SourceChunk[]): { annotatedAnswer: string, citations: Citation[] } {
        let annotatedAnswer = answerText;
        const citations: Citation[] = [];

        let citationCounter = 1;

        for (const claim of validClaims) {
            const scoredSources = sourceChunks.map(chunk => ({
                chunk,
                sim: cosineSimilarity(claim.embedding, chunk.embedding)
            })).sort((a, b) => b.sim - a.sim);

            const topSources = scoredSources.slice(0, 3);
            if (topSources.length === 0) continue;

            const marker = `[${citationCounter}]`;

            const parts = annotatedAnswer.split(claim.text);
            if (parts.length > 1) {
                annotatedAnswer = parts[0] + claim.text + ` ${marker}` + parts.slice(1).join(claim.text);
            }

            citations.push({
                claim_span: claim.text,
                source_ids: topSources.map(s => s.chunk.source_id),
                chunk_texts: topSources.map(s => s.chunk.text),
                confidence: topSources[0].sim
            });

            citationCounter++;
        }

        return { annotatedAnswer, citations };
    }
}
