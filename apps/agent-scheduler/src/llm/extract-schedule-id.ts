import { generateObject, type LanguageModel } from "ai";
import z from "zod";
import type { Schedule } from "agents-sdk";

export async function extractScheduleId(
	model: LanguageModel,
	query: string,
	schedules: Schedule[],
) {
	const { object } = await generateObject({
		model,
		schema: z.object({
			scheduleId: z.string().optional(),
		}),
		prompt: `
          You are an intelligent schedule manager. The user requested cancelling a schedule.
          Try to figure out which schedule ID from the list below is the best match.

          Prompt: "${query}"

          Current tasks: ${JSON.stringify(schedules)}

          Respond with a JSON object of the form:
            { "scheduleId": "[id]" }
          if you find a match, or
            { "scheduleId": undefined }
          if there is no match.
        `,
	});

	return object.scheduleId;
}
