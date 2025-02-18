import { log } from "@clack/prompts";
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";
import ejs from "ejs";
import { execSync } from "child_process";

/**
 * Recursively copies all files and directories from src to dest.
 * Files ending with '.hbs' are treated as Handlebars templates.
 *
 * @param src - Source directory.
 * @param dest - Destination directory.
 * @param context - Context for compiling Handlebars templates.
 */
export async function copyDirectory(
	src: string,
	dest: string,
	context: Record<string, any>,
): Promise<void> {
	// Create the destination directory if it does not exist.
	await fs.mkdir(dest, { recursive: true });

	// Read directory entries from src.
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		let destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			// Recursively process subdirectories.
			await copyDirectory(srcPath, destPath, context);
		} else if (entry.isFile()) {
			// Check if the file has a Handlebars extension ('.ejs').
			if (entry.name.endsWith(".ejs")) {
				console.log(entry.name);
				// Read the template file content.
				const templateContent = await fs.readFile(srcPath, "utf8");
				// Render the template with the given context.
				const compiledContent = ejs.render(templateContent, context);

				// Remove the .ejs extension from the destination filename.
				destPath = destPath.replace(/\.ejs/, "");
				// Write the compiled content to the destination file.
				await fs.writeFile(destPath, compiledContent, "utf8");
			} else {
				// For regular files, simply copy them.
				await fs.copyFile(srcPath, destPath);
			}
		}
	}
}

/**
 * Updates the tsconfig.json file by appending a new include entry.
 */
export async function updateTsconfig(
	tsconfigPath: string,
	includes: string[],
): Promise<void> {
	if (!existsSync(tsconfigPath)) {
		log.warn(
			`tsconfig.json not found at ${tsconfigPath}. Skipping tsconfig update.`,
		);
		return;
	}

	// Read and parse tsconfig.json.
	const tsconfigContent = await fs.readFile(tsconfigPath, "utf8");
	let tsconfig;
	try {
		tsconfig = JSON.parse(tsconfigContent);
	} catch (error) {
		log.error("Failed to parse tsconfig.json.");
		return;
	}

	// Ensure the "include" property exists and is an array.
	if (!Array.isArray(tsconfig.include)) {
		tsconfig.include = [];
	}

	for (const include of includes) {
		// Append the new entry if it does not already exist.
		if (!tsconfig.include.includes(include)) {
			tsconfig.include.push(include);
			tsconfig.include.sort();
			await fs.writeFile(
				tsconfigPath,
				JSON.stringify(tsconfig, null, 2),
				"utf8",
			);
			log.success(`tsconfig.json updated with new include: ${include}`);
		} else {
			log.info(`Include entry ${include} already exists in tsconfig.json.`);
		}
	}
}

export function formatDirectory(path: string) {
	execSync(`biome format --write ${path}`);
}
