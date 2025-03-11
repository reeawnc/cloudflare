import { describe, test, expect } from 'vitest';
import z from "zod";

const SERVER_URL = 'http://localhost:8787';
const TEST_ITERATIONS = 4;
const PASSING_THRESHOLD = 0.75; // 75% pass rate required

describe('Structured Outputs Integration Tests', () => {
	test('should return correct object structure', async () => {
		const schema = z.object({
			recipe: z.object({
				name: z.string(),
				ingredients: z.array(
					z.object({ name: z.string(), amount: z.string() }),
				),
				steps: z.array(z.string()),
			}),
		});

		const results = [];

		for (let i = 0; i < TEST_ITERATIONS; i++) {
			try {
				const response = await fetch(`${SERVER_URL}/`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ prompt: "Create a recipe for sourdough bread." }),
				});

				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}

				const data = await response.json();

				const { success } = schema.safeParse(data);

				results.push(success);
			} catch (error) {
				console.error(`Iteration ${i} failed:`, error);
				results.push(false);
			}
		}

		const successRate = results.filter(Boolean).length / results.length;

		expect(successRate).toBeGreaterThanOrEqual(PASSING_THRESHOLD);
	}, { timeout: 90000 });
});
