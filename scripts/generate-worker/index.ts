import { intro, outro, text, isCancel, cancel, log } from "@clack/prompts";
import * as path from "path";
import { existsSync } from "fs";
import { copyDirectory, updateTsconfig } from "../generator-shared";

const TEMPLATE_DIR = path.join(__dirname, "./worker-template");
const TSCONFIG_PATH = path.join(__dirname, "../../tsconfig.workerd.json");

async function main(): Promise<void> {
	// Display introductory message.
	intro("Project Generator");

	// Verify that the template directory exists.
	if (!existsSync(TEMPLATE_DIR)) {
		log.error(`Template directory not found: ${TEMPLATE_DIR}`);
		process.exit(1);
	}

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

	// Prompt for the project name.
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
		// Copy and process the template folder with Handlebars.
		await copyDirectory(TEMPLATE_DIR, newLocation, { projectName });
		// Update tsconfig.json to include the new project's source files.
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
