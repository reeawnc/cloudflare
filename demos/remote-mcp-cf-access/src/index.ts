import OAuthProvider from '@cloudflare/workers-oauth-provider'
import { McpAgent } from 'agents/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Props } from './workers-oauth-utils'
import { handleAccessRequest } from './access-handler'

const ALLOWED_EMAILS = new Set(['<INSERT EMAIL>'])

export class MyMCP extends McpAgent<Env, {}, Props> {
  server = new McpServer({
    name: 'Access OAuth Proxy Demo',
    version: '1.0.0',
  })

  async init() {
    // Hello, world!
    this.server.tool('add', 'Add two numbers the way only MCP can', { a: z.number(), b: z.number() }, async ({ a, b }) => ({
      content: [{ type: 'text', text: String(a + b) }],
    }))

    // Dynamically add tools based on the user's login. In this case, I want to limit
    // access to my Image Generation tool to just me
    if (ALLOWED_EMAILS.has(this.props.email)) {
      this.server.tool(
        'generateImage',
        'Generate an image using the `flux-1-schnell` model. Works best with 8 steps.',
        {
          prompt: z.string().describe('A text description of the image you want to generate.'),
          steps: z
            .number()
            .min(4)
            .max(8)
            .default(4)
            .describe(
              'The number of diffusion steps; higher values can improve quality but take longer. Must be between 4 and 8, inclusive.',
            ),
        },
        async ({ prompt, steps }) => {
          const response = await this.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt,
            steps,
          })

          return {
            content: [{ type: 'image', data: response.image!, mimeType: 'image/jpeg' }],
          }
        },
      )
    }
  }
}

async function handleMcpRequest(req: Request, env: Env, ctx: ExecutionContext) {
  const { pathname } = new URL(req.url)
  if (pathname === '/sse' || pathname === '/sse/message') {
    return MyMCP.serveSSE('/sse').fetch(req, env, ctx)
  }
  if (pathname === '/mcp') {
    return MyMCP.serve('/mcp').fetch(req, env, ctx)
  }
  return new Response('Not found', { status: 404 })
}

export default new OAuthProvider({
  apiRoute: ['/sse', '/mcp'],
  apiHandler: { fetch: handleMcpRequest as any },
  defaultHandler: { fetch: handleAccessRequest as any },
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
})
