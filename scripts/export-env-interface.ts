import { promises as fs } from "node:fs";
import process from "node:process";

/**
 * Updates the file at the given path so that the `Env` interface is exported.
 * @param filePath The path to the file to update.
 */
async function addExportToInterface(filePath: string): Promise<void> {
	try {
		const content = await fs.readFile(filePath, "utf-8");

		// Replace the interface declaration with an exported version.
		// The regex /^interface Env\b/m matches lines starting with "interface Env".
		const updatedContent = content.replace(/^interface\b/m, "export interface");

		await fs.writeFile(filePath, updatedContent, "utf-8");
		console.log(
			`The interface in "${filePath}" has been updated to be exported.`,
		);

		if (filePath.endsWith(".d.ts")) {
			// Remove the trailing ".d.ts" (5 characters) and append ".ts".
			const newFilePath = `${filePath.slice(0, -5)}.ts`;

			// Rename the file.
			await fs.rename(filePath, newFilePath);
			console.log(`File has been renamed to "${newFilePath}".`);
		} else {
			console.log(
				'No renaming performed as the file does not have a ".d.ts" extension.',
			);
		}
	} catch (error) {
		console.error(`Error processing "${filePath}":`, error);
		process.exit(1);
	}
}

// Ensure a file path is provided as an argument.
if (process.argv.length < 3) {
	console.error("Usage: tsx my-script.ts [path/to/my/file]");
	process.exit(1);
}

const filePath = process.argv[2];

addExportToInterface(filePath);
