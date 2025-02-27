import type { ParallelisationWorkflowParams } from "../parallelisation-workflow.ts";

export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	OPENAI_API_KEY: string;
	AI: Ai;
	PARALLELISATION_WORKFLOW: Workflow<ParallelisationWorkflowParams>;
}
