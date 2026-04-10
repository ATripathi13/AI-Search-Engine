export interface RankedEntity {
    id: string;
    score: number;
}

/**
 * Implements Reciprocal Rank Fusion metric over arbitrary multiple ranking lists
 * RRF_score(d) = Σ 1 / (60 + rank_i(d))
 */
export function mergeRRF(rankedLists: string[][]): RankedEntity[] {
    const scores = new Map<string, number>();

    for (const list of rankedLists) {
        list.forEach((id, index) => {
            const rank = index + 1; // 1-indexed rank
            const point = 1 / (60 + rank);
            scores.set(id, (scores.get(id) || 0) + point);
        });
    }

    return Array.from(scores.entries())
        .map(([id, score]) => ({ id, score }))
        .sort((a, b) => b.score - a.score);
}
