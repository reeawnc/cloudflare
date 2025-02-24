import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types/env.ts";
import type { Variables } from "./types/hono.ts";
import { authApiKey } from "../../../libs/middleware/src/auth-api-key";
import { type convertToCoreMessages, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(cors());
app.use("*", authApiKey);

app.post("/api", async (c) => {
	const openai = createOpenAI({
		apiKey: c.env.OPENAI_API_KEY,
	});
	const { messages } = await c.req.json<{
		messages: Parameters<typeof convertToCoreMessages>[0];
	}>();
	const result = streamText({
		model: openai("gpt-4o"),
		messages,
	});
	return result.toDataStreamResponse({
		headers: {
			// add these headers to ensure that the
			// response is chunked and streamed
			"Content-Type": "text/x-unknown",
			"content-encoding": "identity",
			"transfer-encoding": "chunked",
		},
	});
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
