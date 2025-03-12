# tool-calling-stream-traditional

Welcome to **tool-calling-stream-traditional**, a Cloudflare Worker that demonstrates how a Large Language Model (LLM) can decide whether to call an external “tool” during the conversation flow. It then returns the result in a streamed response. This worker includes an example “weather tool” for illustrative purposes and shows how you might build a flexible workflow when combining AI inference and tool-calling.

## Overview

This worker:
1. Accepts a prompt from the user.
2. Passes the prompt to an LLM capable of calling tools.
3. Inspects the tool calls chosen by the LLM.
4. Mocks a response from the “weather tool” for demonstration.
5. Streams the final AI response back to the client.

### Key Highlights

- **Tool-calling**: The AI can invoke specific tools based on the conversation context.  
- **Streaming**: The final output from the LLM is streamed back for a more dynamic user experience.  
- **Multiple Environments**: Easily configurable for `production`, `staging`, and `development`.

Below is a quick diagram illustrating the flow:

```mermaid
flowchart LR
    A[User Prompt] --> B[LLM Invoked]
    B --> C{Does LLM<br>call a tool?}
    C -- Yes --> D[AI selects Tool<br> e.g. "get_weather"]
    D --> E[Weather Data Mocked]
    C -- No --> F[No Tool Called]
    E --> F[Assemble Response]
    F --> G[Stream Final<br>Response to User]
```

## File Structure

- `wrangler.jsonc`  
  Manages Cloudflare Worker settings and environment variables.

- `package.json`  
  Defines scripts for development, testing, linting, and deployment.

- `vitest.config.ts`  
  Configures Vitest for test execution.

- `src/types/`  
  Houses type definitions, including the Worker’s bindings (`Env`) and Hono types (`hono.ts`).

- `src/index.ts`  
  Main entry point for the Worker’s logic:
  - Creates a Hono app.
  - Defines a mock “weather tool”.
  - Wires up AI interactions.
  - Streams the resulting AI messages back to the client.

## Installation and Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/andyjessop/workers-ai-monorepo.git
   cd workers-ai-monorepo
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Set up Local Development Environment**  
   Make sure to have [Wrangler](https://developers.cloudflare.com/workers/wrangler) installed if you wish to run the Worker locally. Otherwise, the Nx scripts handle everything for you.

4. **Check Environment Variables**  
   In `wrangler.jsonc`, the `ENVIRONMENT` variable defaults to `production`. Ensure all relevant environment variables are correctly set in each environment block (`development`, `staging`, `production`).

## Usage

### Local Development
To run the Worker in local development mode:
```bash
npx nx dev tool-calling-stream-traditional
```
This command uses **Wrangler** under the hood (`wrangler dev -e development`) to spin up a local server.

Alternatively, you may also use:
```bash
npx nx start tool-calling-stream-traditional
```
Both commands are equivalent here; pick whichever you prefer.

Once running, you can send an HTTP `POST` request to `http://localhost:8787/` with a JSON payload containing:
```json
{
  "prompt": "What is the weather in London?"
}
```
The Worker will:
1. Forward the user prompt to the LLM.
2. Potentially call the `get_weather` tool if needed.
3. Return a streamed response indicating the AI’s final message.

### Deploying

You can deploy to one of the configured environments using the following scripts:

**Production**:
```bash
npx nx deploy:production tool-calling-stream-traditional
```

**Staging**:
```bash
npx nx deploy:staging tool-calling-stream-traditional
```

This will use Wrangler to deploy your Worker to your configured Cloudflare account, applying the environment-specific settings in `wrangler.jsonc`.

## Testing and Linting

1. **Unit Tests**
   ```bash
   npx nx test tool-calling-stream-traditional
   ```
   This runs Vitest in watch=false mode.

2. **Linting**
   ```bash
   npx nx lint tool-calling-stream-traditional
   ```
   Uses Biome to check for code cleanliness. Warnings are treated as errors.

3. **Type Checking**
   ```bash
   npx nx type-check tool-calling-stream-traditional
   ```
   Ensures TypeScript definitions are consistent.

## How It Works

When a request arrives at the Worker’s `/` endpoint with a user prompt, the Hono server:
1. Extracts the prompt from the request body.
2. Initialises an LLM inference call with a list of “tools” (in this example, only `get_weather`).
3. Checks the LLM’s response to see which tool, if any, was invoked.
4. Mocks a response from the weather tool.
5. Makes a second LLM call, this time with streaming enabled. The AI’s final response is then piped back to the user as a `ReadableStream`.

That’s it! With **tool-calling-stream-traditional**, you have a lively demonstration of how AI can seamlessly integrate with external tools during conversation flows, complete with streaming responses and environment-specific deployments.

Enjoy exploring!
