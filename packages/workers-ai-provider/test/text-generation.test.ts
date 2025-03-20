import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createWorkersAI } from "../src/index";
import { generateText } from "ai";

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

describe("Text Generation Tests", () => {
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
