# Building a Remote MCP Server on Cloudflare (Without Auth)

This example demonstrates how to create a remote MCP server on Cloudflare Workers that doesn't require authentication. 

## Setup and Installation

```bash
# Clone the repository
git clone git@github.com:cloudflare/ai.git

# Navigate to the project directory
cd ai/demos/remote-mcp-authless/

# Install dependencies
pnpm install

# Deploy your worker
pnpm run deploy
```

Your MCP server will be deployed to a URL like: `remote-mcp-server-authless.your-account.workers.dev/sse`

```bash
# Run locally 
npm run dev
```

Your server will be available at http://localhost:8787/sse

## Connect to Cloudflare AI Playground

You can connect to your MCP server from the Cloudflare AI Playground, which is a remote MCP client:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`worker-name.account-name.workers.dev/sse`)
3. You can now use your MCP tools directly from the playground without any authentication!

## Connect Claude Desktop to your MCP server

Follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or at remote-mcp-server-authless.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and you should see the tools available.
