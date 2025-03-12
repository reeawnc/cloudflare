import type { TaskManagerAgent } from "../TaskManagerAgent";

export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	AI: Ai;
	TASK_MANAGER_AGENT: DurableObjectNamespace<TaskManagerAgent>;
}
