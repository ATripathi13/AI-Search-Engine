import { QueryPlan, SubQuery, RetrievalResult } from '../types';

/**
 * Directed Acyclic Graph representing query dependencies and gathered evidence.
 */
export class ReasoningDAG {
    nodes: Map<string, QueryPlan | SubQuery>;
    edges: { from: string; to: string }[];
    evidence: Map<string, RetrievalResult[]>;

    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.evidence = new Map();
    }

    addNode(queryId: string, node: QueryPlan | SubQuery) {
        this.nodes.set(queryId, node);
    }

    /**
     * Adds an edge from one node to another, strictly enforcing DAG acyclicity.
     * Throws an error immediately to prevent cyclic structures.
     */
    addEdge(from: string, to: string) {
        this.edges.push({ from, to });
        if (this.hasCycle()) {
            this.edges.pop();
            throw new Error(`Cycle detected when adding edge from ${from} to ${to}`);
        }
    }

    addEvidence(queryId: string, results: RetrievalResult[]) {
        const existing = this.evidence.get(queryId) || [];
        this.evidence.set(queryId, [...existing, ...results]);
    }

    private hasCycle(): boolean {
        const visited = new Set<string>();
        const stack = new Set<string>();

        const adjacencyList = new Map<string, string[]>();
        for (const { from, to } of this.edges) {
            if (!adjacencyList.has(from)) adjacencyList.set(from, []);
            adjacencyList.get(from)!.push(to);
        }

        for (const node of this.nodes.keys()) {
            if (!visited.has(node)) {
                if (this.detectCycleDFS(node, visited, stack, adjacencyList)) {
                    return true;
                }
            }
        }
        return false;
    }

    private detectCycleDFS(node: string, visited: Set<string>, stack: Set<string>, adj: Map<string, string[]>): boolean {
        visited.add(node);
        stack.add(node);

        const neighbors = adj.get(node) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (this.detectCycleDFS(neighbor, visited, stack, adj)) return true;
            } else if (stack.has(neighbor)) {
                return true;
            }
        }

        stack.delete(node);
        return false;
    }
}
