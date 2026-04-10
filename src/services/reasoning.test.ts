import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ReasoningDAG } from './reasoning-dag';
import { computeConfidenceScore } from './confidence-scorer';
import { MultiHopLoop } from './multi-hop-loop';
import { PipelineMetrics } from '../types';

describe('Multi-hop Reasoning', () => {
    describe('Property 13: Reasoning DAG Acyclicity', () => {
        it('should correctly prevent cycles from being formed', () => {
            const dag = new ReasoningDAG();
            dag.addNode('A', { id: 'A', query: '..', depends_on: [], intent: 'informational', priority_score: 1.0 });
            dag.addNode('B', { id: 'B', query: '..', depends_on: [], intent: 'informational', priority_score: 1.0 });
            dag.addNode('C', { id: 'C', query: '..', depends_on: [], intent: 'informational', priority_score: 1.0 });

            dag.addEdge('A', 'B');
            dag.addEdge('B', 'C');
            expect(() => dag.addEdge('C', 'A')).toThrow(/Cycle detected/);
        });
    });

    describe('Property 12: Confidence Score Composition', () => {
        it('should linearly combine completeness, agreement, and support consistently between 0 and 1', () => {
            fc.assert(
                fc.property(
                    fc.double({ min: 0, max: 1, noNaN: true }),
                    fc.double({ min: 0, max: 1, noNaN: true }),
                    fc.double({ min: 0, max: 1, noNaN: true }),
                    (c, a, s) => {
                        const score = computeConfidenceScore(c, a, s);
                        expect(score).toBeGreaterThanOrEqual(0);
                        expect(score).toBeLessThanOrEqual(1.0 + 1e-6); // Floating point leniency
                    }
                )
            );
        });
    });

    describe('Property 11: Multi-Hop Iteration Bound', () => {
        it('must stop bounded within maxIterations dynamically', async () => {
            const metrics: PipelineMetrics = { stage_latencies: {}, hop_count: 0, model_selection: 'mock', estimated_cost: 0, token_counts: {} };
            const loop = new MultiHopLoop();

            const evaluateState = async () => ({ completeness: 0.1, agreement: 0.1, support: 0.1, gaps: ['gap1'] });
            const generateFollowUp = async () => [{ id: 'F1', query: '', depends_on: [], intent: 'informational' as const, priority_score: 1 }];
            const executeRetrieval = async () => new Map([['F1', [{ chunk_id: '1', source_id: 'x', text: 'txt', score: 1 }]]]);

            const dag = new ReasoningDAG();
            const result = await loop.execute(dag, evaluateState, generateFollowUp, executeRetrieval, metrics);

            expect(result.iterations).toBe(3);
            expect(metrics.hop_count).toBe(3);
            expect(result.finalConfidence).toBeLessThan(0.7);
        });

        it('must stop early if calculated evaluation confidence >= 0.7', async () => {
            const metrics: PipelineMetrics = { stage_latencies: {}, hop_count: 0, model_selection: 'mock', estimated_cost: 0, token_counts: {} };
            const loop = new MultiHopLoop();

            const evaluateState = async () => ({ completeness: 0.9, agreement: 0.9, support: 0.9, gaps: ['gap1'] });
            const generateFollowUp = async () => [];
            const executeRetrieval = async () => new Map();

            const dag = new ReasoningDAG();
            const result = await loop.execute(dag, evaluateState, generateFollowUp, executeRetrieval, metrics);

            expect(result.iterations).toBe(1);
        });
    });
});
