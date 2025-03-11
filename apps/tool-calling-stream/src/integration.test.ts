import { describe, test, expect } from 'vitest';

const SERVER_URL = 'http://localhost:8787';
const TEST_ITERATIONS = 4;
const PASSING_THRESHOLD = 0.75; // 75% pass rate required

describe('Weather Worker Streaming Integration Tests', () => {
	async function runReliabilityTest({
										  testName, prompt, expectedKeywords,
									  }: {
		testName: string, prompt: string, expectedKeywords: string[],
	}) {
		const results = [];

		for (let i = 0; i < TEST_ITERATIONS; i++) {
			try {
				const response = await fetch(`${SERVER_URL}/`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ prompt }),
				});

				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}

				const reader = response.body?.getReader();
				let content = '';

				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						content += new TextDecoder().decode(value);
					}
				}

				const hasExpectedKeyword = expectedKeywords.some(keyword =>
					content.toLowerCase().includes(keyword)
				);

				results.push(hasExpectedKeyword);
			} catch (error) {
				console.error(`Iteration ${i} failed:`, error);
				results.push(false);
			}
		}

		const successRate = results.filter(Boolean).length / results.length;
		console.log(`${testName} success rate: ${successRate * 100}%`);

		expect(successRate).toBeGreaterThanOrEqual(PASSING_THRESHOLD);
	}

	test('should correctly identify rainy weather in London', async () => {
		await runReliabilityTest({
			testName: 'London Weather Test',
			prompt: 'What is the weather in London?',
			expectedKeywords: ['rain', 'raining', 'rainy'],
		});
	}, { timeout: 90000 });

	test('should correctly identify sunny weather in Paris', async () => {
		await runReliabilityTest({
			testName: 'Paris Weather Test',
			prompt: 'What is the weather in Paris?',
			expectedKeywords: ['sun', 'sunny', 'sunshine'],
		});
	}, { timeout: 90000 });
});
