# Evaluator Optimiser

Welcome to the **Evaluator Optimiser** worker! This project is designed to generate an initial text draft, evaluate it, and then optimise it when necessary, all by orchestrating calls to different AI models. If you have tasks that need iterative refinement—first producing a rough draft, then evaluating and optionally improving it—this worker will automate those steps swiftly.

## How It Works

1. **Draft Generation**  
   A small model produces an initial draft in response to a given prompt.

2. **Draft Evaluation**  
   The same or another small model provides constructive feedback about what can be improved in the initial draft.

3. **Draft Optimisation**  
   If the evaluation indicates revisions are needed, a larger, more capable model refines the initial draft into a final version.

Throughout this process, each step is neatly encapsulated in a Cloudflare Worker Workflow, allowing asynchronous and reliable progression.

## Usage

1. **Local Development**  
   To run the worker in your local development environment, ensure you have:

   - Node.js (LTS version recommended)  
   - Yarn or npm  
   - `nx` CLI (installed globally or via npx)

   Then run:
   ```bash
   npx nx dev evaluator-optimiser
   ```
By default, `wrangler dev` will be invoked under the hood. Your worker will be accessible at a local development endpoint (typically `localhost:<port>`).

2. **Environment Variables**
  - The file `.dev.vars` contains environment variables for development. For instance:
    ```bash
    OPENAI_API_KEY=sk-proj-RdrexlMjH-JdjL6an...
    ```
    Replace the placeholder with your actual OpenAI API key, taking care never to commit real credentials to version control.

  - The `wrangler.jsonc` file configures your worker for Cloudflare. Within it, various environments (development, staging, production) define different variable sets. By default, `ENVIRONMENT` is set to `production`, but it can be overridden in each environment configuration.

3. **Deployments**  
   The `package.json` scripts include:

  - `deploy:production` — Deploys the production environment:
    ```bash
    yarn deploy:production
    ```
    or
    ```bash
    npm run deploy:production
    ```
  - `deploy:staging` — Deploys the staging environment:
    ```bash
    yarn deploy:staging
    ```
    or
    ```bash
    npm run deploy:staging
    ```

   Adjust them according to your preferred package manager. Deployment uses [Wrangler](https://developers.cloudflare.com/workers/wrangler) behind the scenes.

4. **API Endpoints**
  - **`POST /`**  
    Triggers a new workflow instance.  
    **Request body** should be JSON, including:
    ```json
    { "prompt": "Your task description or request here" }
    ```
    **Example response**:
    ```json
    {
      "id": "<workflow-instance-id>",
      "details": {
        "status": "running or completed",
        ...
      }
    }
    ```
  - **`GET /:id`**  
    Fetches the status of an existing workflow instance by its ID.  
    **Example response**:
    ```json
    {
      "status": {
        "result": {
          "initialDraft": "Initial draft",
          "evaluation": {
            "feedback": "Constructive feedback",
            "needsRevision": false
          },
          "finalDraft": "Possibly an improved version"
        },
        ...
      }
    }
    ```

## Project Structure

- **`.dev.vars`**  
  Stores local environment variables, including the `OPENAI_API_KEY`.

- **`wrangler.jsonc`**  
  The configuration file for Cloudflare, setting up environment-specific names, variables, and workflows.

- **`package.json`**  
  Defines scripts for deployment, development, linting, testing, and type-checking.

- **`vitest.config.ts`**  
  Configuration for running tests with Vitest.

- **`src/index.ts`**  
  Exposes the worker as the default export. Implements the HTTP routes to start a workflow and check its status.

- **`src/evaluator-optimiser-workflow.ts`**  
  The workflow logic itself: generating, evaluating, and (optionally) optimising the draft. Each step is handled by a `WorkflowEntrypoint`, enabling robust asynchronous processing.

- **`src/types/env.ts` & `src/types/hono.ts`**  
  Shared type definitions for environment variables and request handling contexts, making the codebase more robust and typed.

## Development and Testing

1. **Local Development**
   ```bash
   npx nx dev evaluator-optimiser
   ```
   or
   ```bash
   yarn dev
   ```
   This will launch the Wrangler development server, deploying your worker to a local address.

2. **Lint**
   ```bash
   yarn lint
   ```
   or
   ```bash
   npm run lint
   ```
   This checks your code with [Biome](https://biomejs.dev/) and surfaces any style or code-quality issues.

3. **Test**
   ```bash
   yarn test
   ```
   or
   ```bash
   npm run test
   ```
   Tests are powered by [Vitest](https://vitest.dev/). The `vitest.config.ts` is straightforward and allows passing even if there are no tests present.

4. **Type-Check**
   ```bash
   yarn type-check
   ```
   or
   ```bash
   npm run type-check
   ```
   This uses the TypeScript compiler to ensure type safety.

## Conclusion

**Evaluator Optimiser** is a compact yet powerful Cloudflare Worker Workflow that harnesses multiple AI models to produce, evaluate, and enhance text content. Whether you need quick, iterative text generation or a more extensive review of complex tasks, this service delivers a streamlined approach to text refinement.

Should you have any questions or suggestions, please open an issue or submit a pull request. Enjoy your refined, AI-driven text outputs!
