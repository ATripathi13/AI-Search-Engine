import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { topologicalSort, validateQueryPlan } from './query-decomposer';
import { SubQuery, QueryPlan } from '../types';

describe('Query Decomposer', () => {
    describe('Property 1: Query Plan Structural Invariant (Topological Sort)', () => {
        it('should correctly order a valid DAG of sub-queries without cycles', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.string({ minLength: 1 }),
                            query: fc.string(),
                            intent: fc.constantFrom('informational' as const, 'comparative' as const, 'causal' as const, 'temporal' as const),
                            priority_score: fc.float({ noNaN: true, min: 0.0, max: 1.0 })
                        }),
                        { minLength: 2, maxLength: 5 }
                    ).map(arr => {
                        // Give them unique IDs and initialize independent depends_on arrays
                        return arr.map((item, index) => ({ ...item, id: `sq_${index}`, depends_on: [] as string[] })) as SubQuery[];
                    }).map(arr => {
                        // add deterministic forward dependencies to guarantee acyclic graph
                        for (let i = 1; i < arr.length; i++) {
                            if (i % 2 !== 0) { // Deterministic pseudo-randomness
                                arr[i].depends_on.push(arr[i - 1].id);
                            }
                        }
                        return arr;
                    }),
                    (subQueries) => {
                        const executionOrder = topologicalSort(subQueries);
                        expect(executionOrder).toHaveLength(subQueries.length);

                        const subQueryMap = new Map(subQueries.map(sq => [sq.id, sq]));

                        // Check that for any subquery, all its dependencies appear before it in executionOrder
                        const executed = new Set<string>();
                        for (const id of executionOrder) {
                            const sq = subQueryMap.get(id);
                            if (sq && sq.depends_on) {
                                for (const dep of sq.depends_on) {
                                    expect(executed.has(dep)).toBe(true);
                                }
                            }
                            executed.add(id);
                        }
                    }
                )
            );
        });

        it('should throw an error on cyclic dependencies', () => {
            const cyc: SubQuery[] = [
                { id: '1', query: '', depends_on: ['2'], intent: 'informational', priority_score: 1.0 },
                { id: '2', query: '', depends_on: ['1'], intent: 'informational', priority_score: 1.0 },
            ];
            expect(() => topologicalSort(cyc)).toThrow(/Cyclic dependency detected/);
        });
    });

    describe('Property 2: Intent Classification Completeness', () => {
        it('Intent must be one of: informational, comparative, causal, temporal', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        original_query: fc.string(),
                        intent: fc.constantFrom('informational' as const, 'comparative' as const, 'causal' as const, 'temporal' as const),
                        sub_queries: fc.array(
                            fc.record({
                                id: fc.string({ minLength: 1 }),
                                query: fc.string(),
                                intent: fc.constantFrom('informational' as const, 'comparative' as const, 'causal' as const, 'temporal' as const),
                                priority_score: fc.float({ min: 0.0, max: 1.0, noNaN: true })
                            }),
                            { minLength: 2, maxLength: 5 }
                        )
                    }).map((plan: any) => {
                        // Unique IDs and fresh depends_on arrays for topological sort
                        plan.sub_queries = plan.sub_queries.map((sq: any, i: number) => ({ ...sq, id: `sq_${i}`, depends_on: [] as string[] }));
                        plan.execution_order = plan.sub_queries.map((sq: any) => sq.id);
                        return plan as QueryPlan;
                    }),
                    (validPlan) => {
                        expect(validateQueryPlan(validPlan)).toBe(true);
                    }
                )
            );
        });

        it('Should reject invalid plan intents', () => {
            const invalidPlan: any = {
                original_query: 'test',
                intent: 'creative', // Invalid
                sub_queries: [
                    { id: '1', query: 't', depends_on: [], intent: 'informational', priority_score: 1.0 },
                    { id: '2', query: 't', depends_on: [], intent: 'informational', priority_score: 1.0 }
                ],
                execution_order: ['1', '2']
            };

            expect(validateQueryPlan(invalidPlan)).toBe(false);
        });
    });
});
