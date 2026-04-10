/**
 * Computes a weighted confidence metric based on retrieval quality constraints.
 * Formula defined by specification requirement 4.6
 */
export function computeConfidenceScore(
    completeness: number,
    source_agreement: number,
    claim_support: number
): number {
    return 0.4 * completeness + 0.35 * source_agreement + 0.25 * claim_support;
}
