export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	OPENAI_API_KEY: string;
	AI: Ai;
	CLOUDFLARE_API_TOKEN: string;
	CLOUDFLARE_ACCOUNT_ID: string;
}
