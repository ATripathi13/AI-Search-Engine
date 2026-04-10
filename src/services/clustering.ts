import { cosineSimilarity, ChunkNode } from './deduplication';

/**
 * Groups chunks using a simplistic agglomerative clustering method.
 * Enforces maximum cluster sizes.
 */
export function agglomerativeClustering(chunks: ChunkNode[], maxClusterSize: number = 5): ChunkNode[][] {
    let clusters: ChunkNode[][] = chunks.map(c => [c]);
    const similarityCache = new Map<string, number>();

    const getSim = (a: ChunkNode[], b: ChunkNode[]) => {
        // Evaluate similarity by looking at the first node in each cluster
        const key = a[0].id + "|" + b[0].id;
        if (similarityCache.has(key)) return similarityCache.get(key)!;
        const sim = cosineSimilarity(a[0].embedding, b[0].embedding);
        similarityCache.set(key, sim);
        return sim;
    };

    while (clusters.length > 1) {
        let bestSim = -1;
        let bestPair: [number, number] | null = null;

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                if (clusters[i].length + clusters[j].length > maxClusterSize) continue;

                const sim = getSim(clusters[i], clusters[j]);
                if (sim > bestSim) {
                    bestSim = sim;
                    bestPair = [i, j];
                }
            }
        }

        // Break if no pairs could be merged (sizes constrained) or similarities are too weak
        if (bestPair === null) break;
        if (bestSim < 0.5) break;

        const [i, j] = bestPair;
        const merged = [...clusters[i], ...clusters[j]];

        // Create new cluster array removing the merged components
        clusters = clusters.filter((_, idx) => idx !== i && idx !== j);
        clusters.push(merged);
    }

    return clusters;
}
