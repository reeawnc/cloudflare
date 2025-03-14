import type { RoutingWorkflowParams } from "../routing-workflow.ts";

export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	OPENAI_API_KEY: string;
	AI: Ai;
	ROUTING_WORKFLOW: Workflow<RoutingWorkflowParams>;
}
