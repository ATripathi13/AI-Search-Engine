export interface SubQuery {
    id: string;
    query: string;
    depends_on: string[];
    intent: 'informational' | 'comparative' | 'causal' | 'temporal';
    priority_score: number; // [0.0, 1.0]
}

export interface QueryPlan {
    original_query: string;
    intent: 'informational' | 'comparative' | 'causal' | 'temporal';
    sub_queries: SubQuery[];
    execution_order: string[]; // topological sort of sub_query ids
}

export interface RetrievalResult {
    chunk_id: string;
    source_id: string; // Document or URL it came from
    text: string;
    score: number; // Initially BM25 or Vector score, later scaled
}

export interface RankedChunk extends RetrievalResult {
    composite_score: number;
}

export interface ReasoningDAG {
    nodes: { [query_id: string]: QueryPlan | SubQuery };
    edges: { from: string; to: string }[];
    evidence: { [query_id: string]: RetrievalResult[] };
}

export interface Citation {
    claim_span: string;
    source_ids: string[];
    chunk_texts: string[];
    confidence: number;
}

export interface AnnotatedAnswer {
    text: string;
    citations: Citation[];
    confidence_score: number;
}

export interface PipelineState {
    status: 'idle' | 'running' | 'completed' | 'failed' | 'degraded';
    current_stage: string;
    collected_evidence: number;
    hop_count: number;
}

export interface PipelineMetrics {
    stage_latencies: { [stage: string]: number };
    model_selection: string;
    token_counts: {
        decomposition?: number;
        context_window?: number;
        generation?: number;
    };
    estimated_cost: number;
    hop_count: number;
}

export interface FeedbackSignal {
    query_hash: string;
    source_ids: string[];
    signal_type: 'click_through' | 'dwell_time' | 'follow_up_query';
}

export interface RankingWeights {
    semantic: number;
    keyword: number;
    authority: number;
    recency: number;
}

export interface EvaluationReport {
    timestamp: string;
    metrics: {
        retrieval_recall_k10: number;
        retrieval_recall_k20: number;
        ndcg: number;
        mrr: number;
        grounding_accuracy: number;
        hallucination_rate: number;
    };
    latency: {
        p50: Record<string, number>;
        p95: Record<string, number>;
        p99: Record<string, number>;
    };
}
