import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateObject } from "ai";
import z from "zod";
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

	const { object } = await generateObject({
		model: openai("gpt-4o-mini"),
		schema: z.object({
			recipe: z.object({
				name: z.string(),
				ingredients: z.array(
					z.object({ name: z.string(), amount: z.string() }),
				),
				steps: z.array(z.string()),
			}),
		}),
		prompt,
	});

	return c.json(object);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
