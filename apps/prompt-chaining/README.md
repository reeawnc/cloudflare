# Prompt Chaining – Worker Readme

**Welcome to the Prompt Chaining worker!** This Cloudflare Worker orchestrates a multi-step AI-driven workflow, prompting a large language model to generate a technical documentation outline, evaluating that outline against certain criteria, and then producing full documentation if it meets the criteria. This README provides an overview of what the worker does, how to run and deploy it, and how you can interact with it.

---

## What Does This Worker Do?

1. **Receives a Prompt**  
   When you send a `POST` request to this worker’s root endpoint (`"/"`), it receives a prompt containing a short description of the subject or context you would like documented.

2. **Generates an Outline**  
   The worker then triggers a workflow step that prompts an AI model (using Cloudflare’s AI integrations) to generate a structured documentation outline.

3. **Evaluates the Outline**  
   A second workflow step evaluates the outline to see if it meets certain specified criteria (for instance, checking whether it covers all necessary details).

4. **Generates Full Documentation**  
   If the outline meets the criteria, the worker triggers a third step that produces fully fleshed-out documentation based on the outline.

5. **Returns Results**  
   The final output includes the approved outline, the evaluation results, and the generated documentation.

If, at any point, the outline fails the evaluation step, the workflow ends, and an error is returned.

---

## Running Locally

To start a local development server using [`wrangler`](https://developers.cloudflare.com/workers/wrangler) and Nx, run:

```bash
npx nx dev prompt-chaining
```

This command:

- Bundles and serves the worker locally on your machine.
- Watches source files for changes.
- Provides a convenient way to test and iterate on the worker.

### Environment Modes

The worker can run in development, staging, or production modes. This is controlled by the `ENVIRONMENT` variable:

- `development`
- `staging`
- `production`

These modes are set in `wrangler.jsonc`. For example, when you run `npx nx dev prompt-chaining`, you will be using the development environment configuration.

---

## Deployment

This project uses `wrangler` under the hood for deployment. The following scripts are available in `package.json`:

- **Deploy to Production**
  ```bash
  npx nx deploy:production prompt-chaining
  ```

- **Deploy to Staging**
  ```bash
  npx nx deploy:staging prompt-chaining
  ```

---

## Usage Examples

1. **Trigger a New Workflow**

   ```bash
   curl -X POST "http://localhost:8787/" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "I need documentation for a new authentication microservice."}'
   ```

  - This will return a JSON object containing an `id` (the workflow instance ID) and `details` (the current workflow status).

2. **Retrieve Workflow Status**

   ```bash
   curl -X GET "http://localhost:8787/<WORKFLOW_INSTANCE_ID>"
   ```

  - Replace `<WORKFLOW_INSTANCE_ID>` with the ID you received when triggering the workflow. This returns the status and any generated results or error messages.

---

## Workflow Patterns

Internally, the worker orchestrates a multi-step “prompt chaining” workflow using Cloudflare’s built-in AI integration. Below is a Mermaid diagram illustrating how the workflow proceeds after the user sends a prompt:

```mermaid
sequenceDiagram
    participant User
    participant Worker
    participant AI

    User->>Worker: POST / with JSON { prompt }
    Worker->>Worker: Step 1: Generate Outline
    Worker->>AI: Send prompt for outline
    AI->>Worker: Return outline
    Worker->>Worker: Step 2: Evaluate Outline
    Worker->>AI: Send outline for evaluation
    AI->>Worker: Return meetsCriteria (true/false)
    alt meetsCriteria is true
        Worker->>Worker: Step 3: Generate Documentation
        Worker->>AI: Send approved outline
        AI->>Worker: Return full documentation
        Worker->>User: Final result with outline and documentation
    else meetsCriteria is false
        Worker->>User: Error: Outline does not meet the criteria
    end
```

### Step-by-Step Breakdown

1. **Generate Outline**  
   The worker prompts the AI to create a **detailed outline** of the technical documentation requested.

2. **Evaluate Outline**  
   The AI analyses the outline against predefined criteria (such as completeness and technical correctness).

3. **Generate Full Documentation**  
   If the outline is valid, the worker prompts the AI to produce a complete, well-organised documentation package.

Each step is modelled as an isolated part of a [Cloudflare Workflow](https://developers.cloudflare.com/workflows/), providing clear logical structure and robust error handling.

---

## Interesting Implementation Details

- **Workers AI**  
  We use [`createWorkersAI`](https://developers.cloudflare.com/workers/ai/) to interact with Cloudflare’s AI, sending prompts and receiving structured responses.

- **Zod for Schema Validation**  
  The code uses [Zod](https://zod.dev/) to define schemas (`outlineSchema`, `criteriaSchema`, `documentationSchema`) that the AI-generated responses must conform to.

- **Workflow-First Approach**  
  Each logical step (`generate outline`, `evaluate outline`, `generate documentation`) is called using `step.do(...)`, making it straightforward to trace the workflow and debug issues.

---

## File-by-File Overview

1. **`.dev.vars`**  
   Holds local development variables (not committed to source control). Useful for local environment customisation.

2. **`wrangler.jsonc`**
  - Specifies global and environment-specific settings (development, staging, production).
  - Defines the name, entry point (`main`), AI binding (`AI`), and the workflow binding (`PROMPT_CHAINING_WORKFLOW`).

3. **`package.json`**
  - Houses the scripts for deploying, developing, linting, testing, and performing type checks.
  - Notable scripts: `dev`, `deploy:production`, `deploy:staging`.

4. **`vitest.config.ts`**
  - Configures [Vitest](https://vitest.dev/) tests, here set to pass even if no tests exist.

5. **`src/types/hono.ts` & `src/types/env.ts`**
  - Declares TypeScript types for the Hono framework and environment bindings.
  - Ensures type safety when referencing the environment (e.g., `ENVIRONMENT`, `AI`).

6. **`src/index.ts`**
  - Defines Hono-based routes:
    - `POST /` to create a new workflow instance.
    - `GET /:id` to fetch a workflow’s status by ID.
  - Uses Cross-Origin Resource Sharing (CORS) middleware for broader client compatibility.

7. **`src/prompt-chaining-workflow.ts`**
  - The core logic of the workflow.
  - Defines three key steps (generate outline, evaluate outline, and generate documentation).
  - Employs `generateObject` from the AI library to structure the AI responses according to Zod schemas.

---

## Testing

From within this project:

```bash
npm test
```

or, for CI environments,

```bash
npm run test:ci
```

These commands will execute your test suite in a headless, watch-disabled mode.

---

## Conclusion

The Prompt Chaining worker demonstrates a dynamic, multi-step approach to generating and validating content using Cloudflare’s AI workflows. By chaining prompts, you can inject iterative logic into your content generation, enabling more sophisticated interactions and higher-quality results.

**Give it a try:** fire up the development server, POST a prompt, and observe how the workflow iterates through the steps to produce meticulously evaluated documentation. If you have any questions or run into issues, please consult the source files or open an issue with your observations.

Happy chaining!

