import { spawn, ChildProcess } from 'child_process';

export interface ServiceConfig {
	// Command to start the service
	command: string;
	// Arguments for the command
	args: string[];
	// URL to check if service is running
	healthCheckUrl: string;
	// Port the service runs on
	port: number;
	// Timeout in ms for service to start
	startupTimeout?: number;
	// Working directory (if different from current)
	cwd?: string;
	// Environment variables to pass to the service
	env?: Record<string, string>;
	// Whether to log service output (default: false)
	verbose?: boolean;
}

export class ServiceRunner {
	private process: ChildProcess | null = null;
	private config: ServiceConfig;

	constructor(config: ServiceConfig) {
		this.config = {
			startupTimeout: 30000, // Default 30s timeout
			verbose: false,
			...config,
		};
	}

	/**
	 * Start the service and wait for it to be ready
	 */
	async start(): Promise<void> {
		if (this.process) {
			throw new Error('Service is already running');
		}

		this.process = spawn(
			this.config.command,
			this.config.args,
			{
				stdio: this.config.verbose ? 'inherit' : 'pipe',
				detached: true, // Makes it a process group leader
				cwd: this.config.cwd,
				env: { ...process.env, ...this.config.env },
			}
		);

		// Set up logging if not in verbose mode
		if (!this.config.verbose && this.process.stdout && this.process.stderr) {
			this.process.stdout.on('data', (data) => {
				console.log(`[${this.config.command}] stdout: ${data}`);
			});

			this.process.stderr.on('data', (data) => {
				console.error(`[${this.config.command}] stderr: ${data}`);
			});
		}

		this.process.on('exit', (code) => {
			if (code !== 0 && code !== null) {
				console.error(`[${this.config.command}] exited with code ${code}`);
			}
		});

		const serviceReady = await this.waitForService();
		if (!serviceReady) {
			this.stop();
			throw new Error(`Service failed to start within ${this.config.startupTimeout}ms`);
		}
	}

	/**
	 * Stop the service
	 */
	stop(): void {
		if (!this.process) {
			return;
		}

		console.log(`Stopping ${this.config.command}...`);

		// Kill the process group on Unix platforms
		if (process.platform !== 'win32' && this.process.pid) {
			try {
				process.kill(-this.process.pid, 'SIGTERM');
			} catch (e) {
				console.error(`Failed to kill process group: ${e}`);
				// Fallback to killing just the process
				this.process.kill('SIGTERM');
			}
		} else {
			// On Windows, just kill the process
			this.process.kill('SIGTERM');
		}

		this.process = null;
	}

	/**
	 * Wait for the service to be ready by polling the health check URL.
	 */
	private async waitForService(): Promise<boolean> {
		const startTime = Date.now();
		const timeout = this.config.startupTimeout!;

		while (Date.now() - startTime < timeout) {
			try {
				const response = await fetch(this.config.healthCheckUrl);
				if (response.status !== 404) {
					console.log(`Service is up and running on port ${this.config.port}`);
					return true;
				}
			} catch (error) {
				// Service not ready yet, wait and try again
			}

			// Wait before trying again
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		return false;
	}
}

/**
 * Helper function to use the service runner in tests.
 */
export const withService = (config: ServiceConfig) => {
	const serviceRunner = new ServiceRunner(config);

	return {
		create: async () => {
			await serviceRunner.start();
		},
		destroy: () => {
			serviceRunner.stop();
		}
	};
};
