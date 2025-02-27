import { generateObject } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createWorkersAI } from "workers-ai-provider";
import z from "zod";
import type { Env } from "./types/env.ts";
import type { Variables } from "./types/hono.ts";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());

// Schema for the initial draft output.
const draftSchema = z.object({
	draft: z.string(),
});

// Schema for the evaluator's feedback.
const evaluationSchema = z.object({
	feedback: z.string(), // Feedback may include suggestions or critiques.
	needsRevision: z.boolean(), // Indicates if further optimization is required.
});

// Schema for the optimized final output.
const optimizedSchema = z.object({
	optimizedDraft: z.string(),
});

app.post("/", async (c) => {
	// Extract the input prompt from the request.
	const { prompt } = (await c.req.json()) as { prompt: string };

	const workersai = createWorkersAI({ binding: c.env.AI });
	const bigModel = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
	const smallModel = workersai("@cf/meta/llama-3.1-8b-instruct");

	// --- Step 1: Generate the Initial Draft ---
	const draftPrompt = `Please generate an initial draft for the following task:\n\n${prompt}\n\n
		Return your response as a JSON object in the format { "draft": "Your initial draft here." }`;
	const { object: draftObj } = await generateObject({
		model: smallModel,
		schema: draftSchema,
		prompt: draftPrompt,
	});

	// --- Step 2: Evaluate the Draft ---
	const evaluationPrompt = `Please evaluate the following draft and provide constructive feedback on how to improve it:\n\n
		${draftObj.draft}\n\n
		Return your evaluation as a JSON object in the format { "feedback": "Your feedback here.", "needsRevision": true/false }`;
	const { object: evaluationObj } = await generateObject({
		model: smallModel,
		schema: evaluationSchema,
		prompt: evaluationPrompt,
	});

	// --- Step 3: Optimize the Draft (if necessary) ---
	// Only run the optimization step if the evaluator indicates that revision is needed.
	let optimizedResult = { optimizedDraft: draftObj.draft };
	if (evaluationObj.needsRevision) {
		const optimizerPrompt = `Based on the following initial draft and evaluator feedback, please produce an improved version:\n\n
			Initial Draft:\n${draftObj.draft}\n\n
			Evaluator Feedback:\n${evaluationObj.feedback}\n\n
			Return your optimized draft as a JSON object in the format { "optimizedDraft": "Your optimized draft here." }`;
		const { object } = await generateObject({
			model: bigModel,
			schema: optimizedSchema,
			prompt: optimizerPrompt,
		});
		optimizedResult = object;
	}

	// Return the initial draft, evaluator feedback, and final optimized draft.
	return c.json({
		initialDraft: draftObj.draft,
		evaluation: evaluationObj,
		finalDraft: optimizedResult.optimizedDraft,
	});
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
