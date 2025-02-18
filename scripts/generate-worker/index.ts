import {
	intro,
	outro,
	text,
	isCancel,
	cancel,
	log,
	select,
} from "@clack/prompts";
import chalk from "chalk";
import * as path from "path";
import {
	copyDirectory,
	formatDirectory,
	updateTsconfig,
} from "../generator-shared";

const TSCONFIG_PATH = path.join(__dirname, "../../tsconfig.workerd.json");

async function main(): Promise<void> {
	// Display introductory message.
	intro("Project Generator");

	const templateName = await select({
		message: "Pick a worker template.",
		options: [
			{
				value: "text-generation",
				label: "Text Generation",
			},
			{
				value: "tool-calling",
				label: "Tool Calling",
			},
			{
				value: "structured-output",
				label: "Structured Output",
			},
			{
				value: "workflow-prompt-chaining",
				label: "Workflow: Prompt Chaining",
			},
			{
				value: "workflow-routing",
				label: "Workflow: Routing",
			},
			{
				value: "workflow-parallelisation",
				label: "Workflow: Parallelisation",
			},
			{
				value: "workflow-orchestrator-workers",
				label: "Workflow: Orchestrator Workers",
			},
			{
				value: "workflow-evaluator-optimiser",
				label: "Workflow: Evaluator Optimiser",
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

	const TEMPLATE_DIR = path.join(__dirname, templateName as string);

	try {
		await copyDirectory(TEMPLATE_DIR, newLocation, { projectName, provider });
	} catch (error) {
		log.error(JSON.stringify(error, null, 2));
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	try {
		await updateTsconfig(TSCONFIG_PATH, [
			`./workers/${projectName}/src/**/*.ts`,
		]);
	} catch (error) {
		log.error(JSON.stringify(error, null, 2));
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	try {
		formatDirectory(newLocation);

		log.success(
			`${chalk.green(`Project successfully generated at ${newLocation}`)}`,
		);
	} catch (error) {
		log.error(JSON.stringify(error, null, 2));
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	const missingSecrets = [];

	if (provider === "openai") {
		missingSecrets.push(
			`${chalk.yellow("OPENAI_API_KEY")} (Required for OpenAI integration.)`,
		);
	}

	missingSecrets.push(
		`${chalk.yellow("API_KEY")} (Required to access your worker in staging/production. Use the "${chalk.yellow("x-api-key")}" header in your requests.)`,
	);

	if (missingSecrets.length > 0) {
		log.warning(
			"Please add the following secrets to your account (or .dev.vars for local development):\n- " +
				missingSecrets.join("\n- "),
		);
	}

	outro(`You're all set! Run 'npx nx dev ${projectName}' to start the worker.`);
}

// Execute the main function and handle any unexpected errors.
main().catch((error) => {
	log.error(`Unexpected error: ${error}`);
	process.exit(1);
});
