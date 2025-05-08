import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Variables } from "./types/hono";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(cors());

// Health check endpoint
app.get("/", (c) => c.json("ok"));

// Image analysis endpoint
app.post("/analyze", async (c) => {
	try {
		const formData = await c.req.formData();
		const image = formData.get("image") as File;

		if (!image) {
			return c.json({ error: "No image provided" }, 400);
		}

		// For now, just return a mock response
		// We'll add actual AI analysis later
		return c.json({
			success: true,
			analysis:
				"This is a placeholder response. AI analysis will be added soon.",
			imageType: image.type,
			imageSize: image.size,
		});
	} catch (error) {
		console.error("Error processing image:", error);
		return c.json({ error: "Failed to process image" }, 500);
	}
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
