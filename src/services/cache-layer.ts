import { Redis } from 'ioredis';

export class CacheLayer {
    constructor(private redis: Redis) { }

    private _hash(text: string): string {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const chr = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash.toString();
    }

    async getQueryResults(query: string): Promise<any | null> {
        const key = `query:${this._hash(query)}`;
        const res = await this.redis.get(key);
        return res ? JSON.parse(res) : null;
    }

    async setQueryResults(query: string, results: any): Promise<void> {
        const key = `query:${this._hash(query)}`;
        await this.redis.set(key, JSON.stringify(results), 'EX', 3600); // 3600s TTL (1 hour)
    }

    async getEmbedding(text: string, model: string): Promise<number[] | null> {
        const key = `emb:${model}:${this._hash(text)}`;
        const res = await this.redis.get(key);
        return res ? JSON.parse(res) : null;
    }

    async setEmbedding(text: string, model: string, embedding: number[]): Promise<void> {
        const key = `emb:${model}:${this._hash(text)}`;
        await this.redis.set(key, JSON.stringify(embedding), 'EX', 3600);
    }
}
