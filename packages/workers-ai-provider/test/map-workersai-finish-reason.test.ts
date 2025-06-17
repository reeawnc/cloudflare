import { describe, it, expect } from "vitest";
import { mapWorkersAIFinishReason } from "../src/map-workersai-finish-reason";
import type { LanguageModelV1FinishReason } from "@ai-sdk/provider";

describe("mapWorkersAIFinishReason", () => {
	describe("direct mappings", () => {
		it('should map "stop" to "stop"', () => {
			const result = mapWorkersAIFinishReason("stop");
			expect(result).toBe("stop");
		});

		it('should map "length" to "length"', () => {
			const result = mapWorkersAIFinishReason("length");
			expect(result).toBe("length");
		});

		it('should map "model_length" to "length"', () => {
			const result = mapWorkersAIFinishReason("model_length");
			expect(result).toBe("length");
		});

		it('should map "tool_calls" to "tool-calls"', () => {
			const result = mapWorkersAIFinishReason("tool_calls");
			expect(result).toBe("tool-calls");
		});

		it('should map "error" to "error"', () => {
			const result = mapWorkersAIFinishReason("error");
			expect(result).toBe("error");
		});

		it('should map "other" to "other"', () => {
			const result = mapWorkersAIFinishReason("other");
			expect(result).toBe("other");
		});

		it('should map "unknown" to "unknown"', () => {
			const result = mapWorkersAIFinishReason("unknown");
			expect(result).toBe("unknown");
		});
	});

	describe("default case handling", () => {
		it('should default to "stop" for null input', () => {
			const result = mapWorkersAIFinishReason(null);
			expect(result).toBe("stop");
		});

		it('should default to "stop" for undefined input', () => {
			const result = mapWorkersAIFinishReason(undefined);
			expect(result).toBe("stop");
		});

		it('should default to "stop" for unrecognized string values', () => {
			const result = mapWorkersAIFinishReason("unrecognized_value");
			expect(result).toBe("stop");
		});

		it('should default to "stop" for empty string', () => {
			const result = mapWorkersAIFinishReason("");
			expect(result).toBe("stop");
		});
	});

	describe("return type validation", () => {
		it("should return a valid LanguageModelV1FinishReason type", () => {
			const validReasons: LanguageModelV1FinishReason[] = [
				"stop",
				"length",
				"tool-calls",
				"error",
				"other",
				"unknown",
			];

			// Test that all our mapped values are valid
			expect(validReasons).toContain(mapWorkersAIFinishReason("stop"));
			expect(validReasons).toContain(mapWorkersAIFinishReason("length"));
			expect(validReasons).toContain(mapWorkersAIFinishReason("model_length"));
			expect(validReasons).toContain(mapWorkersAIFinishReason("tool_calls"));
			expect(validReasons).toContain(mapWorkersAIFinishReason("error"));
			expect(validReasons).toContain(mapWorkersAIFinishReason("other"));
			expect(validReasons).toContain(mapWorkersAIFinishReason("unknown"));
			expect(validReasons).toContain(mapWorkersAIFinishReason(null));
		});
	});

	describe("comprehensive mapping test", () => {
		it("should handle all expected inputs correctly", () => {
			const testCases: Array<[string | null | undefined, LanguageModelV1FinishReason]> = [
				["stop", "stop"],
				["length", "length"],
				["model_length", "length"],
				["tool_calls", "tool-calls"],
				["error", "error"],
				["other", "other"],
				["unknown", "unknown"],
				[null, "stop"],
				[undefined, "stop"],
				["invalid", "stop"],
				["", "stop"],
			];

			for (const [input, expected] of testCases) {
				expect(mapWorkersAIFinishReason(input)).toBe(expected);
			}
		});
	});
});
