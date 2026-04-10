import { getEncoding } from 'js-tiktoken';

export interface ChunkerOptions {
    minChunkTokens?: number;
    maxChunkTokens?: number;
    overlapTokens?: number;
}

export class DocumentChunker {
    private encoding = getEncoding('cl100k_base');
    private separators = ["\n\n", "\n", ". ", " ", ""];

    constructor(private options: ChunkerOptions = {}) {
        this.options.minChunkTokens = options.minChunkTokens ?? 256;
        this.options.maxChunkTokens = options.maxChunkTokens ?? 512;
        this.options.overlapTokens = options.overlapTokens ?? 50;
    }

    countTokens(text: string): number {
        return this.encoding.encode(text).length;
    }

    splitText(text: string): string[] {
        const subChunks = this._splitRecursively(text, this.options.maxChunkTokens!, 0);

        const finalChunks: string[] = [];
        let currentChunk = "";

        for (const piece of subChunks) {
            const combined = currentChunk ? currentChunk + piece : piece;
            if (this.countTokens(combined) > this.options.maxChunkTokens!) {
                finalChunks.push(currentChunk);

                // Exact token overlap
                const tokens = this.encoding.encode(currentChunk);
                let overlapText = "";
                if (tokens.length > this.options.overlapTokens!) {
                    const overlapTokens = tokens.slice(-this.options.overlapTokens!);
                    overlapText = this.encoding.decode(overlapTokens);
                } else {
                    overlapText = currentChunk;
                }
                currentChunk = overlapText + piece;
            } else {
                currentChunk = combined;
            }
        }

        if (currentChunk.trim().length > 0) {
            finalChunks.push(currentChunk);
        }

        return finalChunks;
    }

    private _splitRecursively(text: string, maxTokens: number, separatorIndex: number): string[] {
        if (this.countTokens(text) <= maxTokens) {
            return [text];
        }

        const sep = this.separators[separatorIndex];
        if (sep === undefined) {
            return [text]; // Base case: no more separators
        }

        const splits = text.split(sep);
        const result: string[] = [];

        for (let i = 0; i < splits.length; i++) {
            const piece = i < splits.length - 1 ? splits[i] + sep : splits[i];
            if (this.countTokens(piece) > maxTokens) {
                result.push(...this._splitRecursively(piece, maxTokens, separatorIndex + 1));
            } else {
                result.push(piece);
            }
        }

        return result;
    }
}
