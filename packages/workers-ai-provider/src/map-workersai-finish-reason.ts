import type { LanguageModelV1FinishReason } from "@ai-sdk/provider";

export function mapWorkersAIFinishReason(
	finishReason: string | null | undefined,
): LanguageModelV1FinishReason {
	switch (finishReason) {
		case "stop":
			return "stop";
		case "length":
		case "model_length":
			return "length";
		case "tool_calls":
			return "tool-calls";
		case "error":
			return "error";
		case "other":
			return "other";
		case "unknown":
			return "unknown";
		default:
			// Default to `stop` for backwards compatibility
			return "stop";
	}
}
