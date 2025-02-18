import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types/env.ts";
import type { Variables } from "./types/hono.ts";
import { authApiKey } from "../../../libs/middleware/src/auth-api-key";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());
app.use("*", authApiKey);

// Schema for the orchestrator output: an array of subtasks.
const orchestratorSchema = z.object({
	tasks: z.array(z.string()),
});

// Schema for each worker's output: a response string for the given subtask.
const workerOutputSchema = z.object({
	response: z.string(),
});

// Schema for the final aggregated output.
const aggregatorSchema = z.object({
	finalResult: z.string(),
});

app.post("/", async (c) => {
	// Extract the initial task prompt from the request.
	const { prompt } = (await c.req.json()) as { prompt: string };

	const openai = createOpenAI({
		apiKey: c.env.OPENAI_API_KEY,
	});
	const bigModel = openai("gpt-4o");
	const smallModel = openai("gpt-4o-mini");

	// --- Step 1: Orchestrator Generates Subtasks ---
	// The orchestrator analyses the complex coding task and produces a list of subtasks.
	const orchestratorPrompt = `Given the following complex coding task:\n\n${prompt}\n\n
		Please break it down into a list of subtasks needed to complete the task.
		Return your answer as a JSON object in the format { "tasks": ["Task 1", "Task 2", ...] }`;

	const { object: orchestratorResult } = await generateObject({
		model: bigModel,
		schema: orchestratorSchema,
		prompt: orchestratorPrompt,
	});

	// --- Step 2: Workers Execute Each Subtask in Parallel ---
	// For each subtask, call a worker LLM instance to address it.
	const workerPromises = orchestratorResult.tasks.map((taskPrompt) => {
		const workerLLMPrompt = `You are a specialised coding assistant. Please complete the following subtask:\n\n${taskPrompt}\n\n
			Return your result as a JSON object in the format { "response": "Your detailed response here." }`;

		return generateObject({
			model: smallModel,
			schema: workerOutputSchema,
			prompt: workerLLMPrompt,
		});
	});

	// Execute all worker calls concurrently.
	const workerResults = await Promise.all(workerPromises);
	const workerResponses = workerResults.map((result) => result.object.response);

	// --- Step 3: Aggregator Synthesises the Worker Responses ---
	// The aggregator LLM receives all worker outputs and synthesises a final comprehensive result.
	const aggregatorPrompt = `The following are responses from various workers addressing subtasks for a complex coding task:\n\n
		${workerResponses
			.map((resp, index) => `Subtask ${index + 1}: ${resp}`)
			.join("\n\n")}
		\n\nPlease synthesise these responses into a single, comprehensive final result.
		Return your answer as a JSON object in the format { "finalResult": "Your comprehensive result here." }`;

	const { object: aggregatorResult } = await generateObject({
		model: bigModel,
		schema: aggregatorSchema,
		prompt: aggregatorPrompt,
	});

	// Return the orchestrator subtasks, each worker's response, and the aggregated final result.
	return c.json({
		orchestratorTasks: orchestratorResult.tasks,
		workerResponses,
		finalResult: aggregatorResult.finalResult,
	});
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
