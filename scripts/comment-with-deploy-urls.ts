#!/usr/bin/env tsx
import { execSync } from "child_process";
import * as fs from "fs";

main();

/**
 * Entry point for the script.
 * Validates arguments, retrieves affected projects and deploy URLs,
 * then posts or updates the comment on the GitHub pull request.
 */
async function main(): Promise<void> {
	// Validate command-line arguments.
	const { commentsUrl, githubToken } = validateArguments(process.argv.slice(2));

	// Retrieve the list of affected projects.
	const projects = getAffectedProjects();

	// Extract deploy URLs from the affected projects.
	const urls = getDeployUrls(projects);
	const commentHeader = "Staging URLs deployed:";
	const deployUrls = urls.join("\n");
	const requestBody = { body: `${commentHeader}\n${deployUrls}` };

	// Construct headers for GitHub API requests.
	const headers = getRequestHeaders(githubToken);

	try {
		// Check for an existing comment in the pull request.
		const existingComment = await fetchExistingComment(
			commentsUrl,
			headers,
			commentHeader,
		);

		if (existingComment && existingComment.url) {
			// If an existing comment is found, update it.
			await updateComment(existingComment.url, headers, requestBody);
			console.log("Comment updated successfully");
		} else {
			// Otherwise, create a new comment.
			await createComment(commentsUrl, headers, requestBody);
			console.log("Comment posted successfully");
		}
	} catch (error) {
		console.error("Error posting comment:", error);
		process.exit(1);
	}
}

/**
 * Validates that the correct command-line arguments have been provided.
 * @param args - The array of command-line arguments.
 * @returns An object containing the comments URL and GitHub token.
 */
function validateArguments(args: string[]): {
	commentsUrl: string;
	githubToken: string;
} {
	if (args.length < 2) {
		console.error(
			"Usage: npx tsx scripts/comment-with-deploy-urls.ts <commentsUrl> <githubToken>",
		);
		process.exit(1);
	}
	const [commentsUrl, githubToken] = args;
	return { commentsUrl, githubToken };
}

/**
 * Retrieves the list of affected projects by executing a shell command.
 * @returns An array of affected project names.
 */
function getAffectedProjects(): string[] {
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
	// Assume that projects are space- or newline-separated.
	const projects = affectedProjectsOutput.trim().split(/\s+/);
	console.log("Affected projects:", projects);
	return projects;
}

/**
 * Iterates through the list of projects to extract deploy URLs.
 * @param projects - An array of project names.
 * @returns An array of staging deploy URLs.
 */
function getDeployUrls(projects: string[]): string[] {
	const urls: string[] = [];
	for (const project of projects) {
		const url = getDeployUrlForProject(project);
		if (url) {
			urls.push(url);
		}
	}
	return urls;
}

/**
 * For a given project, attempts to determine the deploy URL by reading
 * the package.json and wrangler.jsonc files.
 * @param project - The project name.
 * @returns The deploy URL if available; otherwise, null.
 */
function getDeployUrlForProject(project: string): string | null {
	const packageJsonPath = `./workers/${project}/package.json`;
	if (!fs.existsSync(packageJsonPath)) {
		console.log(`Skipping ${project}: package.json not found`);
		return null;
	}

	let pkg: any;
	try {
		pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
	} catch (error) {
		console.error(`Error parsing ${packageJsonPath}:`, error);
		return null;
	}

	// Verify the existence of a "deploy:staging" script.
	if (!pkg.scripts || !pkg.scripts["deploy:staging"]) {
		console.log(`Skipping ${project}: no deploy:staging script found`);
		return null;
	}

	const wranglerPath = `./workers/${project}/wrangler.jsonc`;
	if (!fs.existsSync(wranglerPath)) {
		console.log(`Skipping ${project}: wrangler.jsonc not found`);
		return null;
	}

	let wranglerContent: Record<string, any>;
	try {
		wranglerContent = JSON.parse(fs.readFileSync(wranglerPath, "utf-8"));
	} catch (error) {
		console.error(`Error reading ${wranglerPath}:`, error);
		return null;
	}

	// Extract the worker name from the "env.staging.name" property.
	const stagingName = wranglerContent.env?.staging?.name;
	if (stagingName) {
		const url = `https://${stagingName}.andrewdjessop.workers.dev`;
		console.log(`Found URL for ${project}: ${url}`);
		return url;
	} else {
		console.log(`No staging name found in ${wranglerPath}`);
		return null;
	}
}

/**
 * Constructs the headers required for GitHub API requests.
 * @param githubToken - The GitHub token.
 * @returns An object representing the request headers.
 */
function getRequestHeaders(githubToken: string): Record<string, string> {
	return {
		"Content-Type": "application/json",
		Authorization: `token ${githubToken}`,
		Accept: "application/vnd.github+json",
		"User-Agent": "github-actions[bot]",
		"X-GitHub-Api-Version": "2022-11-28",
	};
}

/**
 * Retrieves existing comments from the GitHub pull request and searches
 * for a comment that contains the specified header.
 * @param commentsUrl - The URL for fetching comments.
 * @param headers - The headers to include in the request.
 * @param commentHeader - The header text to search for.
 * @returns The existing comment object if found; otherwise, null.
 */
async function fetchExistingComment(
	commentsUrl: string,
	headers: Record<string, string>,
	commentHeader: string,
): Promise<any | null> {
	console.log("Checking for existing comment...");
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
	const comments = (await getResponse.json()) as any[];
	const existingComment = comments.find(
		(comment: { body?: string; url?: string }) =>
			comment.body && comment.body.includes(commentHeader),
	);
	return existingComment || null;
}

/**
 * Updates an existing GitHub comment.
 * @param commentUrl - The URL of the comment to update.
 * @param headers - The headers to include in the request.
 * @param requestBody - The body of the request containing the new comment content.
 */
async function updateComment(
	commentUrl: string,
	headers: Record<string, string>,
	requestBody: object,
): Promise<void> {
	console.log("Existing comment found. Updating comment...");
	const patchResponse = await fetch(commentUrl, {
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
}

/**
 * Creates a new GitHub comment on the pull request.
 * @param commentsUrl - The URL for posting a new comment.
 * @param headers - The headers to include in the request.
 * @param requestBody - The body of the request containing the comment content.
 */
async function createComment(
	commentsUrl: string,
	headers: Record<string, string>,
	requestBody: object,
): Promise<void> {
	console.log("No existing comment found. Creating a new comment...");
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
}
