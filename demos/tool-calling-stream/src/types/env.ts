export interface Env {
	ENVIRONMENT: "production" | "development" | "staging";
	AI: Ai;
	CLOUDFLARE_API_TOKEN: string;
	CLOUDFLARE_ACCOUNT_ID: string;
}
