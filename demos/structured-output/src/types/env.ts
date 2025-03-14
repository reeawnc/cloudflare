export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	OPENAI_API_KEY: string;
	AI: Ai;
}
