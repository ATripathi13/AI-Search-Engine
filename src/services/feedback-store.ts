import { FeedbackSignal, RankingWeights } from '../types';

export class FeedbackStore {
    private signals: FeedbackSignal[] = [];
    private weights: RankingWeights;

    constructor(initialWeights: RankingWeights) {
        this.weights = { ...initialWeights };
    }

    addSignal(signal: FeedbackSignal) {
        const processedSignal = { ...signal };
        // Follow up queries are intrinsically implicit negatives
        if (processedSignal.signal_type === 'follow_up_query') {
            // Marking negative signal conceptually handled natively inside recalibration iteration logic
        }
        this.signals.push(processedSignal);

        // Process weighting resets after enough interaction batch collections
        if (this.signals.length >= 100) {
            this.recalibrateWeights();
            this.signals = []; // empty batch
        }
    }

    getWeights(): RankingWeights {
        return this.weights;
    }

    getSignalsCount(): number {
        return this.signals.length;
    }

    /**
     * Recalibrates weights based on aggregated batched feedback metrics.
     * Enforces sum constraint to exactly 1.0 
     */
    private recalibrateWeights() {
        let { semantic, keyword, authority, recency } = this.weights;

        let positiveGains = 0;
        let negativePenalties = 0;

        for (const s of this.signals) {
            if (s.signal_type === 'click_through' || s.signal_type === 'dwell_time') {
                positiveGains += 0.01;
            } else if (s.signal_type === 'follow_up_query') {
                negativePenalties += 0.01;
            }
        }

        // Apply dummy semantic recalibration logic 
        semantic += positiveGains;
        semantic -= negativePenalties;
        if (semantic <= 0) semantic = 0.01; // Hard floor bounds

        // Standardize and normalize all 4 weights collectively to equal exactly 1.0 limit
        const total = semantic + keyword + authority + recency;

        this.weights = {
            semantic: semantic / total,
            keyword: keyword / total,
            authority: authority / total,
            recency: recency / total
        };
    }
}
