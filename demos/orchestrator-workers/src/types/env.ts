import type { OrchestratorWorkersWorkflowParams } from "../orchestrator-workers-workflow.ts";

export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	OPENAI_API_KEY: string;
	AI: Ai;
	ORCHESTRATOR_WORKERS_WORKFLOW: Workflow<OrchestratorWorkersWorkflowParams>;
}
