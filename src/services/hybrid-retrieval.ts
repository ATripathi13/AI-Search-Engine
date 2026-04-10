import pLimit from 'p-limit';
import { BM25 } from './bm25';
import { VectorSearch } from './vector-search';
import { mergeRRF } from './rrf';
import { RetrievalResult } from '../types';

export class HybridRetrievalEngine {
    constructor(private bm25: BM25, private vectorSearch: VectorSearch) { }

    async retrieve(query: string, queryVector: number[], topK: number = 10): Promise<RetrievalResult[]> {
        // Run BM25 and Vector Search concurrently
        const [bm25Results, vectorResults] = await Promise.all([
            Promise.resolve(this.bm25.search(query, topK)),
            this.vectorSearch.search(queryVector, topK)
        ]);

        const bm25List = bm25Results.map(r => r.id);
        const vectorList = vectorResults.map(r => r.id);

        const rrfRanked = mergeRRF([bm25List, vectorList]);

        // Hydrate ranked IDs back into RetrievalResults
        // In full implementation, text is pulled from a document store
        return rrfRanked.map(result => {
            const originalVector = vectorResults.find(v => v.id === result.id);
            return {
                chunk_id: result.id,
                source_id: originalVector?.payload?.source_id || `src_${result.id}`,
                text: originalVector?.payload?.text || `Text for ${result.id}`,
                score: result.score
            };
        });
    }

    /**
     * Executes concurrent scraping operations using maximum parallelism of 10
     */
    async scrapeConcurrently(urls: string[]): Promise<{ url: string, content: string }[]> {
        const limit = pLimit(10);

        return Promise.all(
            urls.map(url => limit(async () => {
                // Actual fetch would occur here
                await new Promise(res => setTimeout(res, 50)); // Simulated latency
                return { url, content: `Mock scraped content from ${url}` };
            }))
        );
    }
}
