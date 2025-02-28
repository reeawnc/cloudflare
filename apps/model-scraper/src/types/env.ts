export interface Env {
	AI: Ai;
	ENVIRONMENT: "production" | "development" | "staging";
	GITHUB_TOKEN: string;
	JSON_DATA: KVNamespace;
	OPENAI_API_KEY: string;
}
