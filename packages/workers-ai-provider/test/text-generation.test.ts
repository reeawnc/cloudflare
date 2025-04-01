import { generateText } from "ai";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createWorkersAI } from "../src/index";

const TEST_ACCOUNT_ID = "test-account-id";
const TEST_API_KEY = "test-api-key";
const TEST_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const textGenerationHandler = http.post(
	`https://api.cloudflare.com/client/v4/accounts/${TEST_ACCOUNT_ID}/ai/run/${TEST_MODEL}`,
	async () => {
		return HttpResponse.json({ result: { response: "Hello" } });
	},
);

const server = setupServer(textGenerationHandler);

describe("REST API - Text Generation Tests", () => {
	beforeAll(() => server.listen());
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	it("should generate text (non-streaming)", async () => {
		const workersai = createWorkersAI({
			apiKey: TEST_API_KEY,
			accountId: TEST_ACCOUNT_ID,
		});
		const result = await generateText({
			model: workersai(TEST_MODEL),
			prompt: "Write a greeting",
		});
		expect(result.text).toBe("Hello");
	});
});

describe("Binding - Text Generation Tests", () => {
	it("should generate text (non-streaming)", async () => {
		const workersai = createWorkersAI({
			binding: {
				run: async (modelName: string, inputs: any, options?: any) => {
					return { response: "Hello" };
				},
			},
		});

		const result = await generateText({
			model: workersai(TEST_MODEL),
			prompt: "Write a greeting",
		});

		expect(result.text).toBe("Hello");
	});
});
