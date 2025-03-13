# Tool Calling

Welcome to **Tool Calling**, a Cloudflare Worker that demonstrates how a Large Language Model (LLM) can decide whether to call an external “tool” during the conversation flow. It then returns the result in a streamed response. This worker includes an example “weather tool” for illustrative purposes and shows how you might build a flexible workflow when combining AI inference and tool-calling.

## Table of Contents
- [Overview](#overview)
- [Usage](#usage)
- [Architecture](#architecture)

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

## Usage
### Local Development
To run the Worker in local development mode:
```bash
npx nx dev tool-calling
```
This command uses **Wrangler** under the hood (`wrangler dev -e development`) to spin up a local server.

Alternatively, you may also use:
```bash
npx nx start tool-calling
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
npx nx deploy:production tool-calling
```

**Staging**:
```bash
npx nx deploy:staging tool-calling
```

This will use Wrangler to deploy your Worker to your configured Cloudflare account, applying the environment-specific settings in `wrangler.jsonc`.

## Architecture
Below is a quick diagram illustrating the flow:

```mermaid
graph TD;
    A[User Prompt] --> B[LLM Invoked]
    B --> C{Does LLM<br>call a tool?}
    C -- Yes --> D[AI selects Tool<br> e.g. "get_weather"]
    D --> E[Weather Data Mocked]
    C -- No --> F[No Tool Called]
    E --> F[Assemble Response]
    F --> G[Stream Final<br>Response to User]
```

This project uses the **Tool Use Pattern** from the Agentic Design Patterns Cheatsheet, where the AI dynamically interacts with external tools to enhance its capabilities.