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
			{
				value: "text-generation-workers-ai-provider",
				label: "Text Generation (workers-ai-provider)",
			},
			{
				value: "tool-calling-workers-ai-provider",
				label: "Tool Calling (workers-ai-provider)",
			},
			{
				value: "structured-output-workers-ai-provider",
				label: "Structured Output (workers-ai-provider)",
			},
			{
				value: "workflow-prompt-chaining",
				label: "Workflow: Prompt Chaining (workers-ai-provider)",
			},
			{
				value: "workflow-routing",
				label: "Workflow: Routing (workers-ai-provider)",
			},
			{
				value: "workflow-parallelisation",
				label: "Workflow: Parallelisation (workers-ai-provider)",
			},
			{
				value: "workflow-orchestrator-workers",
				label: "Workflow: Orchestrator Workers (workers-ai-provider)",
			},
			{
				value: "workflow-evaluator-optimiser",
				label: "Workflow: Evaluator Optimiser (workers-ai-provider)",
			},
		],
	});

	const provider = await select({
		message: "Which model provider would you like to use?",
		options: [
			{
				value: "openai",
				label: "OpenAI",
			},
			{
				value: "workers-ai",
				label: "Workers AI",
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
		console.log(TSCONFIG_PATH);
		const TEMPLATE_DIR = path.join(__dirname, templateName as string);
		await copyDirectory(TEMPLATE_DIR, newLocation, { projectName, provider });
		await updateTsconfig(TSCONFIG_PATH, [
			`./workers/${projectName}/src/**/*.ts`,
		]);

		log.success(`Project successfully generated at ${newLocation}`);
	} catch (error) {
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	// Display outro message.
	log.warning(
		"In order to use your worker in staging/production, you need to provide an API_KEY secret, and pass that value in requests with the x-api-key header.",
	);
	outro(`You're all set! Run 'npx nx dev ${projectName}' to start the worker.`);
}

// Execute the main function and handle any unexpected errors.
main().catch((error) => {
	log.error(`Unexpected error: ${error}`);
	process.exit(1);
});
