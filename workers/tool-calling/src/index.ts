import type { Env } from "./types/env";

export default {
	async fetch(_, env): Promise<Response> {
		const response = (await env.AI.run(
			"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
			{
				messages: [
					{
						role: "user",
						content: "What's the weather like in London?",
					},
				],
				tools: [
					{
						name: "get_weather_in_location",
						description:
							"Gets details about the weather in a specific location",
						parameters: {
							type: "object",
							properties: {
								location: {
									type: "string",
									description: "The location.",
								},
							},
							required: ["location"],
						},
					},
				],
			},
		)) as {
			response?: string;
			tool_calls?: {
				name: string;
				arguments: unknown;
			}[];
		};

		const selected_tool = response?.tool_calls?.[0];

		const finalResponse = await env.AI.run(
			"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
			{
				messages: [
					{
						role: "user",
						content: "What's the weather like in London?",
					},
					{
						role: "assistant",
						content: "",
						tool_call: selected_tool.name,
					},
					{
						role: "tool",
						name: selected_tool.name,
						content: "Rainy",
					},
				],
				tools: [
					{
						name: "get_weather_in_location",
						description:
							"Gets details about the weather in a specific location",
						parameters: {
							type: "object",
							properties: {
								location: {
									type: "string",
									description: "The location.",
								},
							},
							required: ["location"],
						},
					},
				],
			},
		);

		return new Response(
			JSON.stringify(
				{
					firstResponse: response,
					selected_tool,
					finalResponse,
				},
				null,
				2,
			),
		);
	},
} satisfies ExportedHandler<Env>;
