import { QdrantClient } from '@qdrant/js-client-rest';

/**
 * Parses strict environment tokens instantiating the cloud boundaries connecting native indexing databases.
 */
export function getQdrantClient(): QdrantClient {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY || undefined;

    return new QdrantClient({ url, apiKey });
}

export class VectorSearch {
    constructor(private client: QdrantClient = getQdrantClient(), private collectionName: string = "engine_chunks") { }

    async configureCollection(vectorSize: number = 1536) {
        try {
            await this.client.getCollection(this.collectionName);
        } catch (e) {
            await this.client.createCollection(this.collectionName, {
                vectors: { size: vectorSize, distance: "Cosine" },
                hnsw_config: { m: 16, ef_construct: 200 }
            });
        }
    }

    async search(queryVector: number[], topK: number = 10): Promise<{ id: string, score: number, payload: any }[]> {
        const results = await this.client.search(this.collectionName, {
            vector: queryVector,
            limit: Math.max(10, Math.min(50, topK)),
            with_payload: true
        });

        return results.map(r => ({
            id: typeof r.id === 'string' ? r.id : String(r.id),
            score: r.score,
            payload: r.payload
        }));
    }

    async upsert(id: string, vector: number[], payload: any) {
        await this.client.upsert(this.collectionName, {
            wait: true,
            points: [{ id, vector, payload }]
        });
    }
}
