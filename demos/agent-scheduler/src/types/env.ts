import type { SchedulerAgent } from "../SchedulerAgent.ts";

export interface Env {
	AI: Ai;
	SCHEDULER_AGENT: DurableObjectNamespace<SchedulerAgent>;
}
