import { streamText } from "ai";
import { http, type DefaultBodyType } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createWorkersAI } from "../src/index";

const TEST_ACCOUNT_ID = "test-account-id";
const TEST_API_KEY = "test-api-key";
const TEST_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const defaultStreamingHandler = http.post(
	`https://api.cloudflare.com/client/v4/accounts/${TEST_ACCOUNT_ID}/ai/run/${TEST_MODEL}`,
	async () => {
		return new Response(
			[
				`data: {"response":"Hello chunk1"}\n\n`,
				`data: {"response":"Hello chunk2"}\n\n`,
				"data: [DONE]\n\n",
			].join(""),
			{
				status: 200,
				headers: {
					"Content-Type": "text/event-stream",
					"Transfer-Encoding": "chunked",
				},
			},
		);
	},
);

const server = setupServer(defaultStreamingHandler);

describe("Workers AI - Streaming Text Tests", () => {
	beforeAll(() => server.listen());
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	it("should stream text using Workers AI provider (via streamText)", async () => {
		const workersai = createWorkersAI({
			apiKey: TEST_API_KEY,
			accountId: TEST_ACCOUNT_ID,
		});

		const result = streamText({
			model: workersai(TEST_MODEL),
			prompt: "Please write a multi-part greeting",
		});

		let accumulatedText = "";
		for await (const chunk of result.textStream) {
			accumulatedText += chunk;
		}

		expect(accumulatedText).toBe("Hello chunk1Hello chunk2");
	});

	it("should handle chunk without 'response' field gracefully", async () => {
		server.use(
			http.post(
				`https://api.cloudflare.com/client/v4/accounts/${TEST_ACCOUNT_ID}/ai/run/${TEST_MODEL}`,
				async () => {
					// Notice that the second chunk has no 'response' property,
					// just tool_calls and p fields, plus an extra brace.
					return new Response(
						[
							`data: {"response":"Hello chunk1"}\n\n`,
							`data: {"tool_calls":[],"p":"abdefgh"}\n\n`,
							"data: [DONE]\n\n",
						].join(""),
						{
							status: 200,
							headers: {
								"Content-Type": "text/event-stream",
								"Transfer-Encoding": "chunked",
							},
						},
					);
				},
			),
		);

		const workersai = createWorkersAI({
			apiKey: TEST_API_KEY,
			accountId: TEST_ACCOUNT_ID,
		});

		const result = streamText({
			model: workersai(TEST_MODEL),
			prompt: "test chunk without response",
		});

		let finalText = "";
		for await (const chunk of result.textStream) {
			finalText += chunk;
		}

		expect(finalText).toBe("Hello chunk1");
	});

	it("passes through additional options to the AI run method", async () => {
		let capturedOptions: null | DefaultBodyType = null;

		server.use(
			http.post(
				`https://api.cloudflare.com/client/v4/accounts/${TEST_ACCOUNT_ID}/ai/run/${TEST_MODEL}`,
				async ({ request }) => {
					const body = await request.json();
					capturedOptions = body;

					return new Response(
						[`data: {"response":"Hello with options"}\n\n`, "data: [DONE]\n\n"].join(
							"",
						),
						{
							status: 200,
							headers: {
								"Content-Type": "text/event-stream",
								"Transfer-Encoding": "chunked",
							},
						},
					);
				},
			),
		);

		const workersai = createWorkersAI({
			apiKey: TEST_API_KEY,
			accountId: TEST_ACCOUNT_ID,
		});

		// Create a model with custom options
		const model = workersai(TEST_MODEL, {
			someOption: "value",
			anotherCustomOption: 42,
		});

		const result = streamText({
			model: model,
			prompt: "Test with custom options",
		});

		// Consume the stream
		let text = "";
		for await (const chunk of result.textStream) {
			text += chunk;
		}

		console.log(capturedOptions);

		expect(text).toBe("Hello with options");
		// Verify that our custom options were passed in the request
		expect(capturedOptions).toHaveProperty("someOption", "value");
		expect(capturedOptions).toHaveProperty("anotherCustomOption", 42);
	});
});
