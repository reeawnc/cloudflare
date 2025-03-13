/**
 * This script performs the following actions:
 * 1. Runs `npx nx show projects --affected` to obtain a list of affected Nx projects.
 * 2. Builds a Map of project name => project root by recursively scanning for package.json files.
 * 3. For each affected project:
 *    - Looks up its root folder in the project map.
 *    - Uses `git ls-files` to list all tracked files in that project.
 *    - Reads each file's contents and concatenates them (with file path prepended).
 *    - Appends this concatenated content to the user-provided PROMPT.
 *    - Calls the Cloudflare AI endpoint with the constructed prompt.
 *    - Writes the AI response to `README.md` in the project's root folder.
 *
 * Environment variables required:
 *   - OPENAI_API_KEY
 *
 * Usage:
 *   node script.mjs
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import z from "zod";

// Retrieve the OpenAI API key from environment variables.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

// Verify required environment variables.
const requiredEnvVars = ["OPENAI_API_KEY"];
for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		throw new Error(`Missing required environment variable: ${envVar}`);
	}
}

// User-provided prompt with instructions.
const PROMPT = `
# Introduction
You are a REAME.md generator. Your goal is to generate a README.md file for a project based on the codebase.

## General Instructions
- Use markdown syntax to format the README.md file content
- Use Mermaid syntax to generate diagrams

## Sections
The following sections must be included in the README.md file:

1. # [Project Name] - name is taken from package.json and formatted as a title
 	- description - a few short sentences about the project
2. ## Table of Contents
3. ## Overview - a brief overview of the project's purpose, functionality, and architecture
4. ## Usage - how to start the project locally, how to interact with the project's API if it has one
5. ## Architecture - a high-level overview of the project's architecture, including diagrams if applicable

## Usage Instructions
- assume that the user has already cloned the repository and installed all dependencies.
- all commands should be run from the root of the project directory.
- all npm scripts are run using the format "npx nx [command] [project]" where [command] is the npm script name and [project] is the project name in the package.json.
- add a description for each npm script listed in the package.json.
- for projects that expose an API, detail each API call in its own section, and you must include request/response formats and the full curl command to make the request.
- if the project is a "lib" - i.e. it's a helper file, or some other kind of standalone file, then include a section on how to import and use the lib. Imports should all be relative, so we import the file directly, e.g. import { myLib } from '../../../libs/my-lib/src/my-lib';

## Architecture Instructions
- Only if the project is an 'app', create a system diagram using the Mermaid syntax. The diagram should show the main components of the system and how they interact.
- Only if the project uses LLMs or AI in some way, highlight any of the patterns described below in the Agentic Patterns Cheatsheet. Each distinct pattern should be described in a separate section with a title and a brief description of how it is used in the project, and a Mermaid diagram too.

### Mermaid Diagrams
- mermaid diagrams MUST NOT contain parentheses in the descriptions. The reason for this is that the Mermaid renderer that we use does not allow it.

E.g.
WRONG:

graph TD;
    A[Request] -->|x-api-key| B{Middleware}
    B -->|Valid Key| C[Proceed to API (Lambda)]
    B -->|Invalid Key| D[Return Error]

CORRECT:

graph TD;
    A[Request] -->|x-api-key| B{Middleware}
    B -->|Valid Key| C[Proceed to API]
    B -->|Invalid Key| D[Return Error]


## Agentic Design Patterns Cheatsheet

This document summarises essential agentic design patterns, distinguishing clearly between predefined Workflows and fully autonomous Agentic Patterns.

Key Definitions

Workflows: Systems where large language models (LLMs) and tools follow predefined, explicit steps.

Agents: Systems where LLMs autonomously direct their processes, dynamically deciding on tool usage and task management.

Workflow Patterns

1. Prompt Chaining
Sequential decomposition into fixed subtasks.
Use Case: Predictable tasks decomposed into simple steps.
Example: Drafting an outline → verifying criteria → completing the document.

2. Routing
Classify inputs to direct tasks into specialised downstream processes.
Use Case: Complex tasks with distinct categories requiring specific handling.
Example: Customer support queries routed to appropriate specialised processes or models based on query type.

3. Parallelisation
Tasks divided into simultaneous LLM operations; two main variations:
Sectioning: Tasks divided into independent parallel subtasks.
Use Case: Multiple independent evaluations or operations.
Example: Concurrent content moderation and query response generation.
Voting: Multiple iterations of identical tasks aggregated for higher confidence.
Use Case: Tasks needing diverse perspectives or redundancy.
Example: Multiple LLM prompts reviewing code for vulnerabilities.

4. Orchestrator-Workers
A central orchestrating LLM dynamically assigns subtasks to worker LLMs.
Use Case: Complex tasks with unpredictable subtask decomposition.
Example: Multi-file coding changes or dynamic information gathering tasks.

5. Evaluator-Optimizer
Iterative refinement loop between task execution (LLM) and evaluation (feedback-providing LLM).
Use Case: Tasks benefiting from iterative, criteria-based improvement.
Example: Literary translations or iterative research processes.

Fully Agentic Patterns

1. Reflection Pattern
Agents introspectively evaluate their performance and iteratively refine their strategies.
Key Steps: Perform task → Collect outcomes → Reflect and evaluate → Adjust strategy.
Example: A trading bot adjusting its strategies based on daily performance metrics.

2. Tool Use Pattern
Agents extend their abilities by dynamically interacting with external tools or APIs.
Key Steps: Identify task → Invoke appropriate tool → Integrate returned data into workflow.
Example: Customer support bot fetching and providing billing information from an API.

3. Planning Pattern
Agents formulate and execute multi-step plans dynamically, aligning with real-time goals.
Key Steps: Define goal → Analyse resources and constraints → Generate sequential action plan → Execute and monitor.
Example: Logistics agent planning optimal delivery routes considering multiple real-time constraints.

4. Multi-Agent Pattern
Multiple specialised agents collaboratively executing complex tasks.
Key Steps: Task assignment → Context/result sharing → Coordinated execution.
Example: Multi-agent trading system with dedicated agents for market data, analysis, risk assessment, and portfolio management.

5. Autonomous Agent
Fully autonomous systems independently managing tasks dynamically, seeking environmental feedback, and occasionally requiring human interaction.
Key Characteristics: Autonomous planning and operation, dynamic tool usage, iterative problem-solving with environmental feedback.
Example: Autonomous coding agent performing software edits across multiple files, continuously validating its work through execution and human checkpoints.

## Output
Return your answer as a JSON object in the format { "markdown": "Your markdown here" }

E.g.
{ "markdown": "# My Project\n\nThis is a description of my project." }
`;

void main();

/**
 * Main function that processes affected projects.
 */
async function main() {
	try {
		// Build a project map: project name -> project root.
		const projectMap = buildProjectMap();

		// 1. Get affected projects from Nx.
		const affectedProjectsOutput = runCommand(
			"npx nx show projects --affected",
		);
		const affectedProjects = affectedProjectsOutput
			.split("\n")
			.map((p) => p.trim())
			.filter((p) => !!p);

		if (affectedProjects.length === 0) {
			console.log("No affected projects found.");
			process.exit(0);
		}

		// 2. Process each affected project.
		for (const project of affectedProjects) {
			// Look up the project root in the project map.
			const projectRoot = projectMap.get(project);
			if (!projectRoot) {
				throw new Error(
					`Unable to locate the root folder for project "${project}" in the project map.`,
				);
			}
			console.log(`\nProcessing project "${project}" at "${projectRoot}" ...`);

			// Retrieve all tracked files in the repository.
			const trackedFiles = runCommand("git ls-files").split("\n");

			// Filter files to include only those within the project root.
			const projectFiles = trackedFiles.filter((file) => {
				const relative = path.relative(projectRoot, file);
				// Ensure the file is actually within the project folder.
				return (
					relative && !relative.startsWith("..") && !path.isAbsolute(relative)
				);
			});

			// Concatenate each file's path and content.
			let concatenatedContent = "";
			for (const filePath of projectFiles) {
				concatenatedContent += `${filePath}\n`;
				const fileData = fs.readFileSync(filePath, "utf-8");
				concatenatedContent += `${fileData}\n\n`;
			}

			// Combine the concatenated content with the user-provided prompt.
			const finalPrompt = `${PROMPT}\n\n${concatenatedContent}`;

			const openai = createOpenAI({
				apiKey: OPENAI_API_KEY,
			});

			// Generate the README.md content by invoking the Cloudflare AI endpoint.
			const { object } = await generateObject({
				model: openai("gpt-4o"),
				schema: z.object({
					markdown: z.string(),
				}),
				prompt: finalPrompt,
			});

			// Save the AI response as README.md in the project's root folder.
			const readmePath = path.join(projectRoot, "README.md");
			fs.writeFileSync(readmePath, object.markdown, "utf-8");
			console.log(`AI response saved to ${readmePath}`);
		}

		console.log("\nScript completed successfully.");
	} catch (err) {
		console.error("ERROR:", err);
		process.exit(1);
	}
}

/**
 * Helper function to run a shell command and capture its stdout as a string.
 *
 * @param {string} command - The shell command to run.
 * @returns {string} The trimmed stdout from the command.
 */
function runCommand(command: string): string {
	return execSync(command, { encoding: "utf-8" }).trim();
}

/**
 * Recursively searches for package.json files starting from a given directory.
 * Skips directories like node_modules and .git.
 *
 * @param {string} dir - The directory to search from.
 * @returns {string[]} An array of paths to package.json files.
 */
function findPackageJsonFiles(dir: string): string[] {
	let results: string[] = [];
	const list = fs.readdirSync(dir);
	for (const entry of list) {
		// Skip commonly excluded directories.
		if (entry === "node_modules" || entry === ".git") {
			continue;
		}
		const fullPath = path.join(dir, entry);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			results = results.concat(findPackageJsonFiles(fullPath));
		} else if (entry === "package.json") {
			results.push(fullPath);
		}
	}
	return results;
}

/**
 * Builds a map of project names to their root directories by parsing package.json files.
 *
 * @returns {Map<string, string>} A Map where keys are project names and values are their root folders.
 */
function buildProjectMap(): Map<string, string> {
	const projectMap = new Map<string, string>();
	// Start the search from the current working directory.
	const packageJsonFiles = findPackageJsonFiles(process.cwd());
	for (const file of packageJsonFiles) {
		try {
			const packageData = JSON.parse(fs.readFileSync(file, "utf-8"));
			if (packageData.name) {
				// The project root is assumed to be the directory containing package.json.
				const projectRoot = path.dirname(file);
				projectMap.set(packageData.name, projectRoot);
			}
		} catch (err) {
			// Log parsing errors and skip the file.
			console.error(`Error parsing ${file}:`, err);
		}
	}
	return projectMap;
}
