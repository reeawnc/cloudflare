import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateText } from "ai";
import type { Env } from "./types/env.ts";
import type { Variables } from "./types/hono.ts";
import { createOpenAI } from "@ai-sdk/openai";
import { authApiKey } from "../../../libs/middleware/src/auth-api-key";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());
app.use("*", authApiKey);

app.post("/", async (c) => {
	const { prompt } = (await c.req.json()) as { prompt: string };
	const openai = createOpenAI({
		apiKey: c.env.OPENAI_API_KEY,
	});

	const result = await generateText({
		model: openai("gpt-4o-mini"),
		prompt,
	});

	return c.json(result);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
