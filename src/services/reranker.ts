/**
 * Cross-encoder Reranker Service 
 * Wrapping `cross-encoder/ms-marco-MiniLM-L-6-v2` mock inferences
 */
export class ReRanker {
    constructor(private batchSize: number = 16) { }

    /**
     * Applies sigmoid activation to a raw logit
     */
    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    /**
     * Re-ranks a list of documents against a query 
     */
    async rerank(query: string, documents: string[]): Promise<number[]> {
        const scores: number[] = [];

        // Mock processing batches
        for (let i = 0; i < documents.length; i += this.batchSize) {
            const batch = documents.slice(i, i + this.batchSize);
            // Mocking logical execution
            for (const doc of batch) {
                // Produce a mock logit and activate to [0, 1] range
                const mockLogit = (Math.random() * 6) - 3; // Random around [-3, 3] 
                scores.push(this.sigmoid(mockLogit));
            }
        }

        return scores;
    }
}
