import * as path from "node:path";
import { cancel, confirm, intro, isCancel, log, outro, spinner, text } from "@clack/prompts";
import chalk from "chalk";
import { copyDirectoryOrFile } from "./utils";
import { exec, execSync } from "node:child_process";

async function main(): Promise<void> {
	intro("Create a new demo project");

	const projectPath = (await text({
		message: "Enter the full path for the new project location:",
		initialValue: "./demos/",
	})) as string;

	const withClient = await confirm({
		message: "Create scaffolding for client side?",
		initialValue: false,
	});

	const projectName = projectPath.split("/").pop();

	if (isCancel(projectName)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}

	if (!projectName) {
		log.error("Invalid project name provided.");
		process.exit(1);
	}

	const scaffoldingFolderName = withClient ? "worker-with-client" : "worker";
	const scaffoldingPath = path.join(__dirname, "scaffolding", scaffoldingFolderName);

	try {
		await copyDirectoryOrFile(scaffoldingPath, projectPath, {
			projectName,
		});
	} catch (error) {
		log.error(JSON.stringify(error, null, 2));
		log.error("An error occurred while generating the project.");
		process.exit(1);
	}

	await new Promise((resolve) => {
		const s = spinner();
		s.start("Running npm install...");

		exec("npm install", { cwd: projectPath }, (error, _, stderr) => {
			if (error) {
				log.error("An error occurred while running npm install.");
				s.stop("npm install failed.");
				process.exit(1);
			}

			if (stderr) {
				log.error(`stderr: ${stderr}`);
			}

			s.stop("npm install completed successfully.");
			resolve(true);
		});
	});

	await new Promise((resolve) => {
		const s = spinner();
		s.start("Running npx nx cf-typegen...");

		exec("npm install", { cwd: projectPath }, (error, _, stderr) => {
			if (error) {
				log.error("An error occurred while running npx nx cf-typegen.");
				s.stop("npm install failed.");
				process.exit(1);
			}

			if (stderr) {
				log.error(`stderr: ${stderr}`);
			}

			s.stop(`npx nx cf-typegen ${projectName} completed successfully.`);
			resolve(true);
		});
	});

	execSync(`biome format --write ${projectPath}`);

	outro(`You're all set! To start your worker:

   ${chalk.dim("$")} ${chalk.green(`npx nx dev ${projectName}`)}`);
}

// Execute the main function and handle any unexpected errors.
main().catch((error) => {
	log.error(`Unexpected error: ${error}`);
	process.exit(1);
});
