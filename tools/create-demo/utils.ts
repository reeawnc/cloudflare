import { type Stats } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
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
	const stats = await fs.stat(src);

	if (stats.isDirectory()) {
		await fs.mkdir(dest, { recursive: true });
		const entries = await fs.readdir(src, { withFileTypes: true });

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name);
			let destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				await copyDirectoryOrFile(srcPath, destPath, context);
			} else if (entry.isFile()) {
				if (entry.name.endsWith(".ejs")) {
					const templateContent = await fs.readFile(srcPath, "utf8");
					const compiledContent = ejs.render(templateContent, context);
					destPath = destPath.replace(/\.ejs$/, "");
					await fs.writeFile(destPath, compiledContent, "utf8");
				} else {
					await fs.copyFile(srcPath, destPath);
				}
			}
		}
	} else if (stats.isFile()) {
		let destStat: Stats;
		let destPath = dest;
		try {
			destStat = await fs.stat(destPath);
		} catch {
			// Destination does not exist.
		}
		if (destStat!.isDirectory()) {
			destPath = path.join(destPath, path.basename(src));
		} else {
			await fs.mkdir(path.dirname(destPath), { recursive: true });
		}

		if (src.endsWith(".ejs")) {
			const templateContent = await fs.readFile(src, "utf8");
			const compiledContent = ejs.render(templateContent, context);
			destPath = destPath.replace(/\.ejs$/, "");
			await fs.writeFile(destPath, compiledContent, "utf8");
		} else {
			await fs.copyFile(src, destPath);
		}
	}
}
