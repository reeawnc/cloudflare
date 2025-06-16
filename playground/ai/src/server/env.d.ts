declare namespace Cloudflare {
	export interface Env {
		AI: Ai;
	}
}

interface Env extends Cloudflare.Env {}
