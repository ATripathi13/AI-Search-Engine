export class BM25 {
    private k1 = 1.5;
    private b = 0.75;
    private documents = new Map<string, string[]>();
    private docLengths = new Map<string, number>();
    private df = new Map<string, number>();
    private avgdl = 0;
    private N = 0;

    addDocument(id: string, text: string) {
        const tokens = this.tokenize(text);
        this.documents.set(id, tokens);
        this.docLengths.set(id, tokens.length);

        const uniqueTokens = new Set(tokens);
        for (const token of uniqueTokens) {
            this.df.set(token, (this.df.get(token) || 0) + 1);
        }

        this.N++;
        this.avgdl = Array.from(this.docLengths.values()).reduce((a, b) => a + b, 0) / this.N;
    }

    // Exposed for the property tests or general usage outside.
    tokenize(text: string): string[] {
        return text.toLowerCase().match(/\w+/g) || [];
    }

    search(query: string, topK: number = 10): { id: string, score: number }[] {
        const queryTokens = this.tokenize(query);
        const scores = new Map<string, number>();

        for (const [id, tokens] of this.documents.entries()) {
            const Ld = this.docLengths.get(id) || 0;
            let score = 0;

            for (const q of queryTokens) {
                const nq = this.df.get(q) || 0;
                // Classic IDF variant
                const idf = Math.log(1 + (this.N - nq + 0.5) / (nq + 0.5));

                const ftd = tokens.filter(t => t === q).length;

                const tf = (ftd * (this.k1 + 1)) / (ftd + this.k1 * (1 - this.b + this.b * (Ld / this.avgdl)));
                score += idf * tf;
            }
            if (score > 0) scores.set(id, score);
        }

        return Array.from(scores.entries())
            .map(([id, score]) => ({ id, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
}
