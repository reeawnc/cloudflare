import {
	intro,
	outro,
	text,
	isCancel,
	cancel,
	log,
	select,
} from "@clack/prompts";
import * as path from "path";
import { copyDirectory, updateTsconfig } from "../generator-shared";

const TSCONFIG_PATH = path.join(__dirname, "../../tsconfig.workerd.json");

async function main(): Promise<void> {
	// Display introductory message.
	intro("Project Generator");

	const templateName = await select({
		message: "Pick a worker template.",
		options: [
			{ value: "chat-streaming", label: "Chat (Streaming)" },
			{
				value: "tool-calling-workers-ai-provider",
				label: "workers-ai-provider Tool Calling",
			},
			{
				value: "structured-output-workers-ai-provider",
				label: "workers-ai-provider Structured Output",
			},
		],
	});

	// Prompt for the new project location.
	const newLocation = await text({
		message: "Enter the full path for the new project location:",
		initialValue: "./workers/",
	});

	if (isCancel(newLocation)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}

	if (!newLocation || typeof newLocation !== "string") {
		log.error("Invalid location provided.");
		process.exit(1);
	}

	const projectName = newLocation.split("/").pop();

	if (isCancel(projectName)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}

	if (!projectName || typeof projectName !== "string") {
		log.error("Invalid project name provided.");
		process.exit(1);
	}

	try {
		const TEMPLATE_DIR = path.join(__dirname, templateName as string);
		await copyDirectory(TEMPLATE_DIR, newLocation, { projectName });
		await updateTsconfig(TSCONFIG_PATH, [
			`./workers/${projectName}/src/**/*.ts`,
		]);

		log.success(`Project successfully generated at ${newLocation}`);
	} catch (error) {
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	// Display outro message.
	outro(`You're all set! Run 'npx nx dev ${projectName}' to start the worker.`);
}

// Execute the main function and handle any unexpected errors.
main().catch((error) => {
	log.error(`Unexpected error: ${error}`);
	process.exit(1);
});
