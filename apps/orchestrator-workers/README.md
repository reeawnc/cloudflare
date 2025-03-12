# Orchestrator Workers

Welcome to **Orchestrator Workers**! This project is a Cloudflare Workers-based orchestrator designed to break down complex coding tasks into manageable subtasks, distribute them among specialised "worker" AI models, and then synthesise the final result into a comprehensive solution.

This README aims to provide:

1. **A high-level overview** of what the worker does.  
2. **Setup and usage instructions**, including how to run locally and deploy.  
3. **A behind-the-scenes look** at the workflow orchestration pattern.  

---

## Quick Start

Run in development mode with:

```bash
npx nx dev orchestrator-workers
```

This command corresponds to invoking `wrangler dev -e development` under the hood, as defined in your **`package.json`** and **`wrangler.jsonc`**.

Once running, the worker will listen for HTTP requests that initialise and interact with the orchestrated workflow:

- **POST** `"/"` to create a new workflow instance.
- **GET** `"/:id"` to retrieve the status of an existing workflow instance.

---

## What Does It Do?

When you send a **POST** request containing a `prompt` to the root endpoint, the following steps happen:

1. **Subtask Generation**
  - The system uses a large language model (`bigModel`) to parse your prompt and generate a structured set of subtasks.
2. **Parallel Subtask Execution**
  - Each subtask is assigned to a smaller, faster language model (`smallModel`) for completion.
3. **Final Aggregation**
  - The results of all subtasks are then merged back into a single, cohesive response using the larger model again.

Finally, the response is returned, providing a detailed, combined answer.

### Simplified Workflow Diagram

```mermaid
flowchart LR
    A[Receive prompt (POST /)] --> B{Generate subtasks using bigModel}
    B --> C[Execute each subtask in parallel using smallModel]
    C --> D[Synthesise final result using bigModel]
    D --> E[Respond with final aggregated answer]
```

---

## Usage

Below is a brief example of how to interact with the worker using `curl`. Feel free to use any other HTTP client or library.

### Create a New Workflow Instance

```bash
curl -X POST https://<your-worker-endpoint>/ \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Build a TypeScript project with multiple steps..."}'
```

**Response**:
```json
{
  "id": "workflow-instance-id",
  "details": {
    // additional status information
  }
}
```

### Check the Status of an Existing Workflow Instance

```bash
curl -X GET https://<your-worker-endpoint>/<workflow-instance-id>
```

**Response**:
```json
{
  "status": {
    // current workflow status
  }
}
```

---

## Local Development

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run the Worker in Dev Mode**

   ```bash
   npx nx dev model-scraper
   ```

  - This starts a local server with `wrangler dev`, using the **development** environment in your **`wrangler.jsonc`**.
  - By default, the worker is accessible at `http://127.0.0.1:8787`.

3. **Lint and Test**

  - **Linting**: `npm run lint` (or `npx nx run orchestrator-workers:lint`)
  - **Testing**: `npm run test` or `npm run test:ci`

---

## Deployment

Deployment is handled by **Wrangler**. You can target different environments (`production`, `staging`, `development`) based on your needs.

- **Production**:
  ```bash
  npm run deploy:production
  ```
  or
  ```bash
  wrangler deploy
  ```

- **Staging**:
  ```bash
  npm run deploy:staging
  ```
  or
  ```bash
  wrangler deploy -e staging
  ```

- **Development** (in case you want to deploy a separate dev environment on Cloudflare):
  ```bash
  wrangler deploy -e development
  ```

The corresponding environment configuration is stored in **`wrangler.jsonc`** under the `env` key.

---

## Configuration Details

### Environment Variables

Inside **`wrangler.jsonc`** and **`.dev.vars`**, you may see these settings:

- **`ENVIRONMENT`**  
  Declares whether the worker runs in `production`, `staging`, or `development`.
- **`AI`**  
  The bound AI resource for model inference.
- **`ORCHESTRATOR_WORKERS_WORKFLOW`**  
  The main workflow binding for orchestrator tasks.

**Note**: Make sure to store sensitive keys (like `OPENAI_API_KEY`) in secure bindings or environment variable files. Do not commit them to source control.

---

## Workflow Patterns and Architecture

This worker showcases a pattern of **multi-step orchestration** combined with **parallelised subtask execution**. The architecture can be broadly described as follows:

1. **High-Level Planning**
  - A large model identifies the subtasks required to solve the user-provided prompt.

2. **Specialised Execution**
  - Each subtask is executed by a more specialised (and faster) model in parallel.

3. **Aggregated Synthesis**
  - The large model merges these partial solutions into a single, comprehensive answer.

This approach combines the power of multiple AI systems, ensuring efficiency (via parallelisation) and high-quality output (via thorough, model-assisted aggregation).

---

## Conclusion

Orchestrator Workers is a dynamic solution that splits complex tasks into smaller, more manageable units, processes them in parallel, and unifies the results, all via Cloudflare Workers and the `cloudflare:workers` AI workflow system. We hope you find it as exciting as we do! If you have any questions or feedback, please open an issue or submit a pull request.

---

Happy coding!
