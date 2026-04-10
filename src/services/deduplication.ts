/**
 * Helper to compute cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ChunkNode {
    id: string;
    composite_score: number;
    embedding: number[];
}

/**
 * Deduplicates semantic chunks based on Cosine Similarity.
 * Keeps the chunk with the highest composite score when conflicts occur over the threshold.
 */
export function deduplicate(chunks: ChunkNode[], threshold: number = 0.85): ChunkNode[] {
    const retained: ChunkNode[] = [];

    // Sort descending by composite score so highest scores have priority
    const sorted = [...chunks].sort((a, b) => b.composite_score - a.composite_score);

    for (const chunk of sorted) {
        let isDuplicate = false;
        // Check if the current chunk is too similar to any already retained chunk
        for (const r of retained) {
            if (cosineSimilarity(chunk.embedding, r.embedding) >= threshold) {
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate) {
            retained.push(chunk);
        }
    }

    return retained;
}
