export function computeCompositeScore(
    w1: number, w2: number, w3: number, w4: number,
    semantic: number, keyword: number, authority: number, recency: number
): number {
    // Check if lengths sum to 1.0 using epsilon for float math
    if (Math.abs(w1 + w2 + w3 + w4 - 1.0) > 1e-5) {
        throw new Error("Weights must sum to 1.0");
    }
    return w1 * semantic + w2 * keyword + w3 * authority + w4 * recency;
}

export function recencyScore(days_old: number): number {
    if (days_old < 0) return 1.0;
    return Math.exp(-0.01 * days_old);
}

const TRUST_TABLE: Record<string, number> = {
    "nature.com": 0.95,
    "arxiv.org": 0.9,
    "wikipedia.org": 0.85,
    "github.com": 0.8,
    "ycombinator.com": 0.75
};

export function authorityScore(domain: string): number {
    return TRUST_TABLE[domain.toLowerCase()] ?? 0.3;
}
