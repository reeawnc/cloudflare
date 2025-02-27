import type { EvaluatorOptimiserWorkflowParams } from "../evaluator-optimiser-workflow.ts";

export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	OPENAI_API_KEY: string;
	AI: Ai;
	EVALUATOR_OPTIMISER_WORKFLOW: Workflow<EvaluatorOptimiserWorkflowParams>;
}
