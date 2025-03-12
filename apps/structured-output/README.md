# Structured Output Worker

This worker, housed under the `structured-output` directory, is a Cloudflare Worker designed to process user prompts and return reliable, **structured JSON** responses. It leverages an AI model to extract recipe-like data from free-form text, ensuring that each response strictly adheres to a predefined structure.

**Why is it interesting?** Because it orchestrates the interplay between Nx, Wrangler, zod, and a Cloudflare-based AI binding in a streamlined workflow. You can run it in development with:

```bash
npx nx dev structured-output
```

Below, you will find everything you need to understand how this worker functions and how to get started.

---

## Purpose and Function

The **Structured Output Worker** is responsible for transforming arbitrary prompts into strict, typed objects. For example, by sending a request describing a recipe idea, it outputs a JSON object with the exact structure defined by our zod schema:

```json
{
  "recipe": {
    "name": "My Great Recipe",
    "ingredients": [
      {
        "name": "Flour",
        "amount": "500g"
      }
    ],
    "steps": [
      "Combine ingredients",
      "Bake for 20 minutes"
    ]
  }
}
```

If you need structured data from a Large Language Model (LLM) without messy formatting or extraneous text, this worker is for you.

---

## Project Structure

This application resides within the Nx workspace under `apps/structured-output/`. Below is a succinct overview of each key file:

1. **`wrangler.jsonc`**  
   Configures how your worker will be deployed to Cloudflare, including environment variables, project names, and advanced options like AI bindings.

2. **`package.json`**  
   Declares scripts for development, testing, linting, and deploying to production or staging environments.

3. **`vitest.config.ts`**  
   Defines how Vitest runs tests. Here, we allow the test suite to pass even if there are no tests.

4. **`src/types/hono.ts`** and **`src/types/env.ts`**  
   Define types and interfaces to ensure strong type-checking across the worker. `Env` details environment-specific bindings, while `Variables` holds generic key-value pairs for runtime.

5. **`src/index.ts`**  
   The worker’s main entry point. It sets up a Hono application, applies CORS, and declares two routes:

  - `GET /` to check if the service is alive.
  - `POST /` to process and return structured JSON from a user-supplied prompt.

6. **`src/integration.test.ts`**  
   An integration test suite that calls the worker’s endpoint, verifies the response structure (using zod schemas), and ensures the worker meets a minimum success threshold over multiple iterations.

---

## Usage

1. **Development**  
   Run the worker locally with:

   ```bash
   npx nx dev prompt-chaining
   ```

   Under the hood, this triggers `wrangler dev -e development`, spinning up a local instance at `http://localhost:8787`. By default, it reads from the environment specified in `wrangler.jsonc` under `development`.

2. **Local Testing**  
   To execute tests locally:

   ```bash
   npx nx test structured-output
   ```
   
   This performs an integration test that repeatedly sends requests to `http://localhost:8787/` and checks whether the structured response conforms to the zod schema.

3. **Deployment**  
   To deploy to production or staging:

   ```bash
   npx nx deploy:production structured-output
   ```
   or
   ```bash
   npx nx deploy:staging structured-output
   ```

   Each environment (e.g. development, staging, production) has a dedicated configuration in `wrangler.jsonc`, allowing you to seamlessly switch between them.

---

## Interesting Workflow Pattern

The worker uses a “prompt chaining” approach to generate strictly typed JSON from freeform text. The flow is simple yet powerful:

```mermaid
flowchart LR
    A[Client] -->|Submits prompt JSON| B[Structured Output Worker]
    B -->|Makes call to AI model (Workers AI binding)| C[AI Provider]
    C -->|Returns structured data| B
    B -->|Validates and returns JSON| A
```

1. The client submits a `POST /` request containing a `prompt`.
2. The worker invokes the AI model (via the `AI` binding) to ensure we get a consistent structure.
3. A zod schema then validates the returned data, guaranteeing it is in the expected format.
4. Finally, the worker returns the validated JSON to the client.

---

## Key Points to Note

- **zod Integration** ensures responses strictly match the schema (`name`, `ingredients`, `steps`), preventing spurious or invalid fields.
- **Workers AI Binding** connects your Cloudflare Worker to LLM capabilities without managing complicated API requests yourself.
- **Nx + Wrangler** streamlines local development and deployment. Nx orchestrates tasks like linting, testing, or building, while Wrangler handles the Cloudflare specifics.

---

## Environment Variables

- **`ENVIRONMENT`**: Indicates the current environment (`production`, `development`, or `staging`).
- **`OPENAI_API_KEY`**: Your OpenAI API key (not required if relying solely on the `AI` binding).
- **`AI`**: The AI binding provided by Cloudflare for direct model inference.

All these are configured in the `wrangler.jsonc` file, and you can override them per environment.

---

## Conclusion

The Structured Output Worker exemplifies a robust method of returning predictable, typed responses from AI models, blending Nx, Wrangler, and typed schemas. With this service running, you can craft recipe data (or similar structured content) from uncertain prompt text in a reliably validated format.

If you have any questions, feel free to open an issue or get in touch with the team. Happy prompting!
