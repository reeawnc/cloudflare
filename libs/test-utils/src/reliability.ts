export interface ReliabilityTestConfig {
	// Base URL of the service
	baseUrl: string;
	// Number of test iterations to run
	iterations?: number;
	// Threshold for passing (0-1, defaults to 0.75)
	passingThreshold?: number;
	// Custom endpoint path (defaults to '/')
	endpoint?: string;
	// HTTP method (defaults to 'POST')
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	// Custom headers to include
	headers?: Record<string, string>;
	// Function to check if a response meets criteria (default checks keywords)
	responseValidator?: (responseData: any) => boolean;
}

/**
 * Run a reliability test against a service
 */
export async function runReliabilityTest(
	testName: string,
	requestBody: any,
	expectedKeywords: string[],
	config: ReliabilityTestConfig
): Promise<boolean> {
	const results: boolean[] = [];
	const iterations = config.iterations || 10;
	const passingThreshold = config.passingThreshold || 0.75;
	const endpoint = config.endpoint || '/';
	const method = config.method || 'POST';
	const headers = {
		'Content-Type': 'application/json',
		...config.headers
	};

	// Default validator checks for keywords
	const validator = config.responseValidator || ((data: any) => {
		const content = typeof data.text === 'string'
			? data.text.toLowerCase()
			: JSON.stringify(data).toLowerCase();

		return expectedKeywords.some(keyword => content.includes(keyword));
	});

	for (let i = 0; i < iterations; i++) {
		try {
			const response = await fetch(`${config.baseUrl}${endpoint}`, {
				method,
				headers,
				body: method !== 'GET' ? JSON.stringify(requestBody) : undefined,
			});

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			const data = await response.json();
			const isValid = validator(data);

			results.push(isValid);
		} catch (error) {
			console.error(`Iteration ${i} failed:`, error);
			results.push(false);
		}
	}

	// Calculate success rate
	const successRate = results.filter(Boolean).length / results.length;
	console.log(`${testName} success rate: ${successRate * 100}%`);

	return successRate >= passingThreshold;
}
