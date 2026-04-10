import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnswerValidator } from './answer-validator';

describe('Answer Validator', () => {
    describe('Property 14: Grounding Score Formula and Unsupported Claim Handling', () => {
        it('computes accurately the ratio of valid claims and flags if < 0.8', () => {
            const validator = new AnswerValidator();

            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 50 }),
                    fc.integer({ min: 0, max: 50 }),
                    (validCount, invalidCount) => {
                        fc.pre(validCount > 0 || invalidCount > 0);

                        const validClaims = Array.from({ length: validCount }).map(() => ({ text: 'V', embedding: [1, 1, 1] }));
                        const invalidClaims = Array.from({ length: invalidCount }).map(() => ({ text: 'I', embedding: [-1, -1, -1] }));

                        // Match semantic similarity perfectly
                        const sources = [[1, 1, 1]];

                        const result = validator.validate([...validClaims, ...invalidClaims], sources, 0.75);

                        const total = validCount + invalidCount;
                        const expectedScore = validCount / total;

                        expect(Math.abs(result.groundingScore - expectedScore)).toBeLessThan(1e-6);
                        expect(result.validClaims.length).toBe(validCount);
                        expect(result.unsupportedClaims.length).toBe(invalidCount);
                        expect(result.insufficientInformation).toBe(expectedScore < 0.8);
                    }
                )
            );
        });
    });
});
