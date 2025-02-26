import * as path from "node:path";
import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	outro,
	select,
	text,
} from "@clack/prompts";
import chalk from "chalk";
import {
	copyDirectoryOrFile,
	formatDirectory,
	updateTsconfig,
} from "../generator-shared";

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
				value: "workers-ai",
				label: "Workers AI",
			},
			{
				value: "openai",
				label: "OpenAI",
			},
		],
	});

	const hasUi = await confirm({
		message: "Would you like a React SPA setup?",
	});

	if (hasUi && provider === "workers-ai") {
		cancel("The React SPA setup currently does not support Workers AI.");
		process.exit(0);
	}

	// Prompt for the new project location.
	const newLocation = await text({
		message: "Enter the full path for the new project location:",
		initialValue: hasUi ? "./apps" : "./workers/",
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

	const serverFile = path.join(__dirname, "servers", templateName as string);
	const serverLocation = hasUi
		? path.join(newLocation, "src", "server")
		: path.join(newLocation, "src");
	const shellLocation = hasUi
		? path.join(__dirname, "worker-shell-with-ui")
		: path.join(__dirname, "worker-shell");
	const libsPath = hasUi ? "../../../../libs" : "../../../libs";

	try {
		await copyDirectoryOrFile(shellLocation, newLocation, {
			libsPath,
			projectName,
			provider,
		});
		await copyDirectoryOrFile(serverFile, serverLocation, {
			libsPath,
			projectName,
			provider,
		});
	} catch (error) {
		log.error(JSON.stringify(error, null, 2));
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	try {
		const serverGlob = hasUi
			? `${newLocation}/src/server/**/*.ts`
			: `${newLocation}/src/**/*.ts`;

		await updateTsconfig(path.join(__dirname, "../../tsconfig.workerd.json"), [
			serverGlob,
		]);

		if (hasUi) {
			await updateTsconfig(
				path.join(__dirname, "../../tsconfig.browser.json"),
				[
					`${newLocation}/src/client/**/*.ts`,
					`${newLocation}/src/client/**/*.tsx`,
				],
			);
		}
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
			`Please add the following secrets to your account (or .dev.vars for local development):
-${missingSecrets.join("\n- ")}`,
		);
	}

	outro(`You're all set! Run 'npx nx dev ${projectName}' to start the worker.`);
}

// Execute the main function and handle any unexpected errors.
main().catch((error) => {
	log.error(`Unexpected error: ${error}`);
	process.exit(1);
});
