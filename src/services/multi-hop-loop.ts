import { ReasoningDAG } from './reasoning-dag';
import { computeConfidenceScore } from './confidence-scorer';
import { PipelineMetrics, SubQuery } from '../types';

export interface EvaluationState {
    completeness: number;
    agreement: number;
    support: number;
    gaps: string[];
}

export class MultiHopLoop {
    private maxIterations = 3;

    async execute(
        dag: ReasoningDAG,
        evaluateState: (dag: ReasoningDAG) => Promise<EvaluationState>,
        generateFollowUp: (gaps: string[], dag: ReasoningDAG) => Promise<SubQuery[]>,
        executeRetrieval: (queries: SubQuery[]) => Promise<Map<string, any[]>>,
        metrics: PipelineMetrics
    ) {
        let iteration = 0;
        let confidence = 0;

        while (iteration < this.maxIterations) {
            iteration++;
            metrics.hop_count = iteration;

            // Evaluate current state of knowledge graph
            const evaluation = await evaluateState(dag);
            confidence = computeConfidenceScore(evaluation.completeness, evaluation.agreement, evaluation.support);

            const totalChunks = Array.from(dag.evidence.values())
                .reduce((sum, chunks) => sum + chunks.length, 0);

            // Halt logic evaluating evidence saturation and minimal confidence rules
            if (confidence >= 0.7) break;
            if (totalChunks > 50) break; // Maximum evidence chunks per query process cap
            if (evaluation.gaps.length === 0) break;

            // Formulate new queries iteratively targeting identified gaps
            const followUps = await generateFollowUp(evaluation.gaps, dag);
            if (followUps.length === 0) break;

            for (const q of followUps) {
                dag.addNode(q.id, q);
            }

            // Retrieve and hydrate DAG
            const newEvidence = await executeRetrieval(followUps);
            for (const [qId, chunks] of newEvidence.entries()) {
                dag.addEvidence(qId, chunks);
            }
        }

        return { finalConfidence: confidence, iterations: iteration };
    }
}
