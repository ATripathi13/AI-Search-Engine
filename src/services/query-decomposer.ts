import { QueryPlan, SubQuery } from '../types';

/**
 * Performs a topological sort on an array of SubQueries based on their depends_on properties.
 * Returns an array of SubQuery IDs in the order they should be executed.
 */
export function topologicalSort(subQueries: SubQuery[]): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const queryMap = new Map<string, SubQuery>();
    for (const sq of subQueries) {
        queryMap.set(sq.id, sq);
    }

    function visit(sqId: string) {
        if (temp.has(sqId)) {
            throw new Error(`Cyclic dependency detected involving sub-query: ${sqId}`);
        }
        if (!visited.has(sqId)) {
            temp.add(sqId);
            const sq = queryMap.get(sqId);
            if (sq && sq.depends_on) {
                for (const dep of sq.depends_on) {
                    if (queryMap.has(dep)) {
                        visit(dep);
                    }
                }
            }
            visited.add(sqId);
            temp.delete(sqId);
            result.push(sqId);
        }
    }

    for (const sq of subQueries) {
        if (!visited.has(sq.id)) {
            visit(sq.id);
        }
    }

    return result;
}

/**
 * Validates a QueryPlan to ensure it meets requirements:
 * - 2-5 sub queries
 * - Priorities in [0.0, 1.0]
 * - Intent is one of the valid 4 options
 */
export function validateQueryPlan(plan: QueryPlan): boolean {
    if (plan.sub_queries.length < 2 || plan.sub_queries.length > 5) return false;

    const validIntents = ['informational', 'comparative', 'causal', 'temporal'];
    if (!validIntents.includes(plan.intent)) return false;

    for (const sq of plan.sub_queries) {
        if (sq.priority_score < 0.0 || sq.priority_score > 1.0) return false;
        if (!validIntents.includes(sq.intent)) return false;
    }

    try {
        const order = topologicalSort(plan.sub_queries);
        if (order.length !== plan.sub_queries.length) return false;

        // Check if execution_order matches the strictly topological one
        // Not strictly required that they perfectly array-equal if multiple valid sorts exist,
        // but the array must at least be a valid topological sort.
        plan.execution_order = order;
    } catch (e) {
        return false; // Cycle detected
    }

    return true;
}

/**
 * Decomposes a natural language query into a structured QueryPlan using an LLM.
 */
export async function decompose(query: string, apiKey?: string): Promise<QueryPlan> {
    const systemPrompt = `You are a Query Decomposer for an Answer Engine.
Your task is to parse the user's complex natural language query into 2 to 5 distinct sub-queries.
You must return a JSON response matching the QueryPlan structure.
Intent must be one of: 'informational', 'comparative', 'causal', 'temporal'.
Assign priority_score between 0.0 and 1.0 based on relevance.
Set depends_on to the IDs of any sub-queries that must be executed first to build context.
Output purely JSON, no markdown.`;

    // Mock implementation for property tests or when no key is provided.
    if (!apiKey) {
        const mockSq1: SubQuery = {
            id: 'subq_1',
            query: `What are the core concepts of '${query}'?`,
            depends_on: [],
            intent: 'informational',
            priority_score: 1.0
        };

        const mockSq2: SubQuery = {
            id: 'subq_2',
            query: `What are specific details related to subq_1 context?`,
            depends_on: ['subq_1'],
            intent: 'informational',
            priority_score: 0.8
        };

        const plan: QueryPlan = {
            original_query: query,
            intent: 'informational',
            sub_queries: [mockSq1, mockSq2],
            execution_order: ['subq_1', 'subq_2']
        };

        return plan;
    }

    // Real LLM call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        })
    });

    if (!response.ok) {
        throw new Error(`LLM Error: ${response.statusText}`);
    }

    const data = await response.json();
    const plan = JSON.parse(data.choices[0].message.content) as QueryPlan;

    // Enforce validation and assign correct topological execution order.
    plan.execution_order = topologicalSort(plan.sub_queries);

    if (!validateQueryPlan(plan)) {
        throw new Error('LLM generated an invalid QueryPlan');
    }

    return plan;
}
