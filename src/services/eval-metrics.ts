/**
 * Computes Precision at K.
 * Strict mathematical ratio mapping relevant item matches inside the top K sequences natively.
 */
export function precisionAtK(retrieved: string[], relevant: Set<string>, k: number): number {
    if (k <= 0) return 0;
    const topK = retrieved.slice(0, k);
    const hits = new Set<string>();
    for (const item of topK) {
        if (relevant.has(item)) hits.add(item);
    }
    return hits.size / k;
}

/**
 * Computes Recall at K.
 * Calculates bounds mapping intersections of relevant data located against full logical relevant subset bounds.
 */
export function recallAtK(retrieved: string[], relevant: Set<string>, k: number): number {
    if (relevant.size === 0) return 0;
    if (k <= 0) return 0;
    const topK = retrieved.slice(0, k);
    const hits = new Set<string>();
    for (const item of topK) {
        if (relevant.has(item)) hits.add(item);
    }
    return hits.size / relevant.size;
}

/**
 * Computes Mean Reciprocal Rank (MRR).
 * Yields inverted placement ranks marking initial discovery lines safely handling absolute misses with zeroes.
 */
export function meanReciprocalRank(retrieved: string[], relevant: Set<string>): number {
    for (let i = 0; i < retrieved.length; i++) {
        if (relevant.has(retrieved[i])) {
            return 1.0 / (i + 1);
        }
    }
    return 0.0;
}

/**
 * Core mathematical engine computing logical un-normalized Discounted Cumulative Gain limits.
 */
function dcgAtK(retrieved: string[], relevant: Set<string>, k: number): number {
    let dcg = 0;
    const topK = retrieved.slice(0, k);
    for (let i = 0; i < topK.length; i++) {
        if (relevant.has(topK[i])) {
            dcg += 1.0 / Math.log2(i + 2); // i is 0-indexed yielding log2(rank+1) scaling 
        }
    }
    return dcg;
}

/**
 * Yields normalized mapping arrays isolating Discounted Gain matrices to precise mathematically standard floats bounded securely under 1.0 scalars
 */
export function ndcgAtK(retrieved: string[], relevant: Set<string>, k: number): number {
    const dcg = dcgAtK(retrieved, relevant, k);

    // Extrapolate Ideal IDCG bounds based on perfect positioning rules
    const idealRetrieved = Array.from(relevant);
    const idcg = dcgAtK(idealRetrieved, relevant, k);

    if (idcg === 0) return 0;
    return dcg / idcg;
}
