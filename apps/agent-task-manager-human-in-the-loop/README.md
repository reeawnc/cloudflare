# Agent Task Manager (Human-in-the-Loop)

This Worker serves as a human-in-the-loop task manager, intelligently deciding when to add tasks, delete tasks, list tasks, or ignore requests. Whenever it decides to add or delete a task, it first generates a "confirmation" that must be approved by a human. This ensures no changes occur without explicit validation.

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Prerequisites](#prerequisites)
4. [Installation and Running](#installation-and-running)
5. [Usage](#usage)
6. [Folder and File Structure](#folder-and-file-structure)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Additional Notes](#additional-notes)

---

## Overview

This project is built with the following objectives:
- **Intelligent Task Management**: Receives user prompts, interprets them, and decides whether to add, delete, or list tasks.
- **Human Approval**: When a user prompts adding or deleting a task, it creates a “confirmation” and requires a human to explicitly accept or reject this action.
- **State Persistence**: Uses Durable Objects to store tasks and confirmations.

By wrapping all critical decisions in a confirmation process, you can integrate AI-based suggestions with human oversight—perfect for safety-critical or collaborative scenarios.

---

## Key Features

- **Add Tasks (Pending Approval)**: The system analyses user queries, extracts the potential task title, and creates a confirmation record. Only upon human confirmation will the task actually be added.
- **Delete Tasks (Pending Approval)**: Searches for the most relevant task to delete and creates a corresponding confirmation. When approved, the deletion is carried out.
- **List Tasks**: Immediately lists all tasks without requiring confirmation.
- **Durable Object for Persistence**: Retains the list of tasks and confirmations across restarts, ensuring state continuity.
- **AI-Powered Parsing**: Leverages a specified AI model for intelligent prompt interpretation.

---

## Prerequisites

- **Node.js** installed (preferably the latest LTS).
- **Nx**: This project uses Nx for running commands, although you can still use npm scripts if you wish.
- **Wrangler** (Cloudflare’s CLI) installed globally or available via Nx.

---

## Installation and Running

1. **Install dependencies** in the root of the monorepo (if applicable):
   ```bash
   npm install
   ```

2. **Run in development** mode:
   ```bash
   npx nx dev agent-task-manager-human-in-the-loop
   ```
   This starts the Worker in development mode (watching for file changes) and applies the configurations from `wrangler.jsonc`.
3. 
---

## Usage

Once the Worker is running, you can interact with it via HTTP requests. Below are the primary endpoints:

### 1. `/query`
Sends a user prompt (free text) to the AI for interpretation:
```bash
curl -X POST "http://localhost:8787/query" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-agent-instance",
    "prompt": "Please add a new task called Write Documentation"
  }'
```
- If the AI decides to **add** or **delete** a task, it returns a confirmation object with an `id`.
- If it decides to list, it will return the existing tasks.
- If it decides no action is needed, it returns a message explaining why.

### 2. `/confirmations/:confirmationId`
Confirms or rejects a previously created confirmation:
```bash
curl -X POST "http://localhost:8787/confirmations/CONFIRMATION_ID_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-agent-instance",
    "confirm": true
  }'
```
- Include the `confirmationId` as a URL parameter.
- **`confirm`** is a boolean:
  - `true` applies the action (adding or deleting the task).
  - `false` rejects the action, and the Worker discards the confirmation.

---

## Folder and File Structure

Below is an overview of the most significant files:

- **`.dev.vars`**  
  A placeholder file for environment variables used in development.

- **`wrangler.jsonc`**  
  Main configuration for Cloudflare Workers. Declares the name (`agent-task-manager-human-in-the-loop`), entry point (`src/index.ts`), and Durable Object classes.

- **`package.json`**  
  Defines scripts for development, testing, linting, and deployment.

- **`vitest.config.ts`**  
  Configuration for Vitest, a testing framework that can be run in watch mode or single-run mode.

- **`src/TaskManagerAgent.ts`**  
  Contains the `TaskManagerAgent` class (extended from `Agent`):
  - **`query(query: string)`**: Interprets the user prompt, potentially returning a confirmation object.
  - **`confirm(confirmationId: string, userConfirmed: boolean)`**: Applies or discards the pending action.
  - **`addTask(title: string, description?: string)`**: Creates a new task in state.
  - **`deleteTask(taskId: string)`**: Removes a task from state.
  - **`listTasks()`**: Returns the full task list.

- **`src/types/hono.ts` and `src/types/env.ts`**  
  Define the application and environment bindings for Hono, specifying how Durable Objects and environment variables are referenced.

- **`src/index.ts`**  
  Exports a Hono application:
  - `/query` and `/confirmations/:confirmationId` endpoints.
  - Creates and retrieves instances of the `TaskManagerAgent` Durable Object.

---

## Deployment

There are two main routes for deployment using **Wrangler**:

1. **Production**:
   ```bash
   npx nx deploy:production agent-task-manager-human-in-the-loop
   ```

2. **Staging**:
   ```bash
   npx nx deploy:staging agent-task-manager-human-in-the-loop
   ```

Each environment points to the relevant configuration specified in `wrangler.jsonc`.

---

## Testing

To run the test suite:

```bash
npx nx test agent-task-manager-human-in-the-loop
```

This uses **Vitest** and runs the tests located throughout the `src` directory. For CI environments or to run tests once, you can use:

```bash
npx nx test:ci agent-task-manager-human-in-the-loop
```

---

## Additional Notes

- **Environment Variables**: The Worker can bind any variables found in `.dev.vars` during development, or in your Cloudflare setup in production.
- **AI Model**: Internally, the Worker uses an AI model for generating suggestions when adding or deleting tasks. The model binding is configured under the `ai` property in `wrangler.jsonc`.
- **Error Handling**: If the AI fails to interpret a user’s prompt, the Worker politely responds that it cannot determine what to do.

Feel free to modify, extend, and integrate this system into your own AI-driven workflows. Happy task managing!
