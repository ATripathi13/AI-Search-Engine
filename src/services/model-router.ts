import { PipelineMetrics } from '../types';

export type SupportedModel = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'claude-3-5-haiku';

export interface RouterConfig {
    defaultModel: SupportedModel;
    budget: number; // Max estimated cost budget in USD 
}

export class ModelRouter {
    constructor(private config: RouterConfig) { }

    /**
     * Estimates cost based on input tokens and selected model. 
     * Constants based per million.
     */
    private estimateCost(model: SupportedModel, inTokens: number, outTokens: number): number {
        const rates = {
            'gpt-4o': { in: 5 / 1000000, out: 15 / 1000000 },
            'gpt-4o-mini': { in: 0.15 / 1000000, out: 0.60 / 1000000 },
            'claude-3-5-sonnet': { in: 3 / 1000000, out: 15 / 1000000 },
            'claude-3-5-haiku': { in: 0.25 / 1000000, out: 1.25 / 1000000 }
        };
        const rate = rates[model];
        return inTokens * rate.in + outTokens * rate.out;
    }

    /**
     * Selects model based on complexity (0.0 to 1.0), tokens, and budgetary constraints
     */
    route(complexity: number, expectedInTokens: number, expectedOutTokens: number, metrics: PipelineMetrics): SupportedModel {
        let selectedModel: SupportedModel = this.config.defaultModel;

        if (complexity > 0.7) {
            const cost4o = this.estimateCost('gpt-4o', expectedInTokens, expectedOutTokens);
            const costSonnet = this.estimateCost('claude-3-5-sonnet', expectedInTokens, expectedOutTokens);

            if (cost4o <= this.config.budget) {
                selectedModel = 'gpt-4o';
            } else if (costSonnet <= this.config.budget) {
                selectedModel = 'claude-3-5-sonnet';
            } else {
                selectedModel = 'gpt-4o-mini';
            }
        } else {
            const costMini = this.estimateCost('gpt-4o-mini', expectedInTokens, expectedOutTokens);
            if (costMini <= this.config.budget) {
                selectedModel = 'gpt-4o-mini';
            } else {
                selectedModel = 'claude-3-5-haiku';
            }
        }

        metrics.model_selection = selectedModel;
        metrics.estimated_cost = this.estimateCost(selectedModel, expectedInTokens, expectedOutTokens);

        return selectedModel;
    }
}
