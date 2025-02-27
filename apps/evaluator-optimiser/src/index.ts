import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types/env.ts";
import type { Variables } from "./types/hono.ts";
export { EvaluatorOptimiserWorkflow } from "./evaluator-optimiser-workflow.ts";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());

/**
 * POST endpoint to trigger a new workflow instance.
 * Expects a JSON payload with a `prompt` property.
 */
app.post("/", async (c) => {
	const { prompt } = (await c.req.json()) as { prompt: string };
	const instance = await c.env.EVALUATOR_OPTIMISER_WORKFLOW.create({
		params: { prompt },
	});
	const status = await instance.status();
	return c.json({ id: instance.id, details: status });
});

/**
 * GET endpoint to fetch the status of an existing workflow instance by its ID.
 */
app.get("/:id", async (c) => {
	const instanceId = c.req.param("id");
	if (instanceId) {
		const instance = await c.env.EVALUATOR_OPTIMISER_WORKFLOW.get(instanceId);
		const status = await instance.status();
		return c.json({ status });
	}
	return c.json({ error: "Instance ID not provided" }, 400);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
