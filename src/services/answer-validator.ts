import { cosineSimilarity } from './deduplication';

export interface Claim {
    text: string;
    embedding: number[];
}

export interface ValidationResult {
    validClaims: Claim[];
    unsupportedClaims: Claim[];
    groundingScore: number;
    insufficientInformation: boolean;
}

export class AnswerValidator {
    /**
     * Extracts distinct claims from generated text. 
     */
    extractClaims(answerText: string): Claim[] {
        const sentences = answerText.split('.').map(s => s.trim()).filter(s => s.length > 0);
        return sentences.map(s => ({
            text: s,
            embedding: new Array(384).fill(0.1) // Represents mock embedding operation
        }));
    }

    /**
     * Validates claims against source chunks using semantic similarity (threshold 0.75).
     */
    validate(claims: Claim[], sourceEmbeddings: number[][], threshold: number = 0.75): ValidationResult {
        const validClaims: Claim[] = [];
        const unsupportedClaims: Claim[] = [];

        for (const claim of claims) {
            let isSupported = false;
            for (const sourceEmb of sourceEmbeddings) {
                if (cosineSimilarity(claim.embedding, sourceEmb) >= threshold) {
                    isSupported = true;
                    break;
                }
            }

            if (isSupported) {
                validClaims.push(claim);
            } else {
                unsupportedClaims.push(claim);
            }
        }

        const total = claims.length;
        const groundingScore = total === 0 ? 1.0 : validClaims.length / total;

        return {
            validClaims,
            unsupportedClaims,
            groundingScore,
            insufficientInformation: groundingScore < 0.8
        };
    }
}
