import { replyToMessage } from "./inference";

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		switch (`${request.method} ${url.pathname}`) {
			case "POST /api/inference":
				return replyToMessage(request, env, ctx);
			default:
				return new Response("Not found", { status: 404 });
		}
	},
};
