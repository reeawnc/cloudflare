#!/usr/bin/env tsx
import { execSync } from "child_process";
import * as fs from "fs";

async function main(): Promise<void> {
	// Validate arguments.
	const args = process.argv.slice(2);
	if (args.length < 2) {
		console.error(
			"Usage: npx tsx scripts/comment-with-deploy-urls.ts <commentsUrl> <githubToken>",
		);
		process.exit(1);
	}

	const [commentsUrl, githubToken] = args;

	// Retrieve the list of affected projects.
	console.log("Getting affected projects...");
	let affectedProjectsOutput: string;
	try {
		affectedProjectsOutput = execSync("npx nx show projects --affected", {
			encoding: "utf-8",
		});
	} catch (error) {
		console.error("Error retrieving affected projects", error);
		process.exit(1);
	}

	// Assume projects are space- or newline-separated.
	const projects = affectedProjectsOutput.trim().split(/\s+/);
	console.log("Affected projects:", projects);

	const urls: string[] = [];

	for (const project of projects) {
		const packageJsonPath = `./workers/${project}/package.json`;
		if (!fs.existsSync(packageJsonPath)) {
			console.log(`Skipping ${project}: package.json not found`);
			continue;
		}

		let pkg: any;
		try {
			pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		} catch (error) {
			console.error(`Error parsing ${packageJsonPath}:`, error);
			continue;
		}

		// Check for deploy:staging script in package.json.
		if (!pkg.scripts || !pkg.scripts["deploy:staging"]) {
			console.log(`Skipping ${project}: no deploy:staging script found`);
			continue;
		}

		const wranglerPath = `./workers/${project}/wrangler.jsonc`;
		if (!fs.existsSync(wranglerPath)) {
			console.log(`Skipping ${project}: wrangler.jsonc not found`);
			continue;
		}

		let wranglerContent: Record<string, any>;
		try {
			wranglerContent = JSON.parse(fs.readFileSync(wranglerPath, "utf-8"));
		} catch (error) {
			console.error(`Error reading ${wranglerPath}:`, error);
			continue;
		}

		// Extract the worker name from the "env.staging.name" property.
		const stagingName = wranglerContent.env?.staging?.name;
		if (stagingName) {
			const url = `https://${stagingName}.andrewdjessop.workers.dev`;
			console.log(`Found URL for ${project}: ${url}`);
			urls.push(url);
		} else {
			console.log(`No staging name found in ${wranglerPath}`);
		}
	}

	// Join all found URLs (if more than one) into a single string.
	const deployUrls = urls.join("\n");
	const commentHeader = "Staging URLs deployed:";

	// Construct the request body.
	const requestBody = {
		body: `${commentHeader}\n${deployUrls}`,
	};

	console.log("Checking for existing comment...");

	// Common headers used for both GET and POST/PATCH requests.
	const headers = {
		"Content-Type": "application/json",
		Authorization: `token ${githubToken}`,
		Accept: "application/vnd.github+json",
		"User-Agent": "github-actions[bot]",
		"X-GitHub-Api-Version": "2022-11-28",
	};

	try {
		// Get all comments from the PR.
		const getResponse = await fetch(commentsUrl, {
			method: "GET",
			headers,
		});

		if (!getResponse.ok) {
			const errorText = await getResponse.text();
			throw new Error(
				`Failed to fetch comments: ${getResponse.status} ${errorText}`,
			);
		}

		const comments = await getResponse.json();

		// Look for an existing comment that contains the header.
		const existingComment = comments.find(
			(comment: { body?: string; url?: string }) =>
				comment.body && comment.body.includes(commentHeader),
		);

		if (existingComment && existingComment.url) {
			console.log("Existing comment found. Updating comment...");
			// Update the existing comment.
			const patchResponse = await fetch(existingComment.url, {
				method: "PATCH",
				headers,
				body: JSON.stringify(requestBody),
			});
			if (!patchResponse.ok) {
				const errorText = await patchResponse.text();
				throw new Error(
					`Failed to update comment: ${patchResponse.status} ${errorText}`,
				);
			}
			console.log("Comment updated successfully");
		} else {
			console.log("No existing comment found. Creating a new comment...");
			// Post a new comment.
			const postResponse = await fetch(commentsUrl, {
				method: "POST",
				headers,
				body: JSON.stringify(requestBody),
			});
			if (!postResponse.ok) {
				const errorText = await postResponse.text();
				throw new Error(
					`Failed to create comment: ${postResponse.status} ${errorText}`,
				);
			}
			console.log("Comment posted successfully");
		}
	} catch (error) {
		console.error("Error posting comment:", error);
		process.exit(1);
	}
}

main();
