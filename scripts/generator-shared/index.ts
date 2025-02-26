import { execSync } from "node:child_process";
import { type Stats, existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { log } from "@clack/prompts";
import ejs from "ejs";

/**
 * Copies a directory or a file from the source to the destination.
 * If the source is a directory, its contents are copied recursively.
 * If the source is a file and ends with '.ejs', the file is processed as a Handlebars template.
 *
 * @param src - The source path (directory or file).
 * @param dest - The destination path.
 * @param context - The context used for rendering templates.
 */
export async function copyDirectoryOrFile(
	src: string,
	dest: string,
	context: Record<string, any>,
): Promise<void> {
	// Get the stats for the source to determine if it's a file or directory.
	const stats = await fs.stat(src);

	if (stats.isDirectory()) {
		// Create the destination directory if it does not exist.
		await fs.mkdir(dest, { recursive: true });
		// Read directory entries from src.
		const entries = await fs.readdir(src, { withFileTypes: true });

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name);
			let destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				// Recursively process subdirectories.
				await copyDirectoryOrFile(srcPath, destPath, context);
			} else if (entry.isFile()) {
				// Process '.ejs' template files.
				if (entry.name.endsWith(".ejs")) {
					const templateContent = await fs.readFile(srcPath, "utf8");
					const compiledContent = ejs.render(templateContent, context);
					// Remove the .ejs extension from the destination filename.
					destPath = destPath.replace(/\.ejs$/, "");
					await fs.writeFile(destPath, compiledContent, "utf8");
				} else {
					// Simply copy regular files.
					await fs.copyFile(srcPath, destPath);
				}
			}
		}
	} else if (stats.isFile()) {
		// If destination exists and is a directory, copy the file into that directory.
		let destStat: Stats;
		let destPath = dest;
		try {
			destStat = await fs.stat(destPath);
		} catch {
			// Destination does not exist.
		}
		// @ts-ignore
		if (destStat?.isDirectory()) {
			destPath = path.join(destPath, path.basename(src));
		} else {
			// Ensure the destination directory exists.
			await fs.mkdir(path.dirname(destPath), { recursive: true });
		}

		// Process '.ejs' files if applicable.
		if (src.endsWith(".ejs")) {
			const templateContent = await fs.readFile(src, "utf8");
			const compiledContent = ejs.render(templateContent, context);
			destPath = destPath.replace(/\.ejs$/, "");
			await fs.writeFile(destPath, compiledContent, "utf8");
		} else {
			// Copy the file directly.
			await fs.copyFile(src, destPath);
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
	const relativeTsconfigPath = tsconfigPath.split("/").pop();

	if (!existsSync(tsconfigPath)) {
		log.warn(
			`tsconfig not found at ${relativeTsconfigPath}. Skipping tsconfig update.`,
		);
		return;
	}

	// Read and parse tsconfig.json.
	const tsconfigContent = await fs.readFile(tsconfigPath, "utf8");
	let tsconfig: any;
	try {
		tsconfig = JSON.parse(tsconfigContent);
	} catch (error) {
		log.error("Failed to parse tsconfig.");
		return;
	}

	// Ensure the "include" property exists and is an array.
	if (!Array.isArray(tsconfig.include)) {
		tsconfig.include = [];
	}

	// Accumulate new include entries.
	const newIncludes: string[] = [];

	for (const include of includes) {
		// Append the new entry if it does not already exist.
		if (!tsconfig.include.includes(include)) {
			tsconfig.include.push(include);
			newIncludes.push(include);
		} else {
			log.info(
				`Include entry ${include} already exists in ${relativeTsconfigPath}.`,
			);
		}
	}

	// If new entries were added, sort, write the file, and log the bullet list.
	if (newIncludes.length > 0) {
		tsconfig.include.sort();
		await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf8");

		const bulletList = newIncludes.map((entry) => `- ${entry}`).join("\n");
		log.success(
			`${relativeTsconfigPath} updated with new includes:\n${bulletList}`,
		);
	}
}

export function formatDirectory(path: string) {
	execSync(`biome format --write ${path}`);
}
