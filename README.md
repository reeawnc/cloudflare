# AI Mono Repository

This repository is a monorepo managed with [Nx](https://nx.dev). It contains multiple apps, workers, and libraries that work together to deliver AI-powered features. The repository provides generators, standardised commands, and deployment workflows for efficient development and continuous integration.

## Usage

### Generating a New Worker

To generate a new worker:

1. Run the worker generator:
   ```bash
   npm run generate-worker
   ```
2. When prompted, type the name of your new worker and press Enter.
3. To start development, run:
   ```bash
   npx nx dev [name-of-worker]
   ```

### Standard Nx Commands

For a given worker (or app), you can use Nx to perform common tasks:

- **Linting**:
  ```bash
  npx nx lint [name-of-worker]
  ```
- **Testing**:
  ```bash
  npx nx test [name-of-worker]
  ```
   **Generating Types**:
  ```bash
  npx nx types [name-of-worker]
  ```
- **Type-checking**:
  ```bash
  npx nx type-check [name-of-worker]
  ```
- **Building**:
  ```bash
  npx nx build [name-of-worker]
  ```

These commands help ensure code quality and maintainability across the monorepo.

### Deployment

Deployment is managed through GitHub Actions:

- **Staging Deployment**:
  When changes are pushed to `main` or through a pull request, the CI workflow automatically runs tests and deploys to staging. The deployment script also posts a comment with the staging URLs.

  All workers generated with `generate-worker` have a `staging` environment setup by default.

- **Production Deployment**:
  Production deployments are triggered by:
  - Pushing to the `production` branch, or
  - Manually triggering the workflow via GitHub’s UI.

### Worker AI Model Status

Models:
  "@cf/meta/llama-2-7b-chat-int8"
  "@cf/mistral/mistral-7b-instruct-v0.1"
  "@cf/meta/llama-2-7b-chat-fp16"
  "@hf/thebloke/llama-2-13b-chat-awq"
  "@hf/thebloke/mistral-7b-instruct-v0.1-awq"
  "@hf/thebloke/zephyr-7b-beta-awq"
  "@hf/thebloke/openhermes-2.5-mistral-7b-awq"
  "@hf/thebloke/neural-chat-7b-v3-1-awq"
  "@hf/thebloke/llamaguard-7b-awq"
  "@hf/thebloke/deepseek-coder-6.7b-base-awq"
  "@hf/thebloke/deepseek-coder-6.7b-instruct-awq"
  "@cf/deepseek-ai/deepseek-math-7b-instruct"
  "@cf/defog/sqlcoder-7b-2"
  "@cf/openchat/openchat-3.5-0106"
  "@cf/tiiuae/falcon-7b-instruct"
  "@cf/thebloke/discolm-german-7b-v1-awq"
  "@cf/qwen/qwen1.5-0.5b-chat"
  "@cf/qwen/qwen1.5-7b-chat-awq"
  "@cf/qwen/qwen1.5-14b-chat-awq"
  "@cf/tinyllama/tinyllama-1.1b-chat-v1.0"
  "@cf/microsoft/phi-2"
  "@cf/qwen/qwen1.5-1.8b-chat"
  "@cf/mistral/mistral-7b-instruct-v0.2-lora"
  "@hf/nousresearch/hermes-2-pro-mistral-7b"
  "@hf/nexusflow/starling-lm-7b-beta"
  "@hf/google/gemma-7b-it"
  "@cf/meta-llama/llama-2-7b-chat-hf-lora"
  "@cf/google/gemma-2b-it-lora"
  "@cf/google/gemma-7b-it-lora"
  "@hf/mistral/mistral-7b-instruct-v0.2"
  "@cf/meta/llama-3-8b-instruct"
  "@cf/fblgit/una-cybertron-7b-v2-bf16"
  "@cf/meta/llama-3-8b-instruct-awq"
  "@hf/meta-llama/meta-llama-3-8b-instruct"
  "@cf/meta/llama-3.1-8b-instruct"
  "@cf/meta/llama-3.1-8b-instruct-fp8"
  "@cf/meta/llama-3.1-8b-instruct-awq"
  "@cf/meta/llama-3.2-3b-instruct"
  "@cf/meta/llama-3.2-1b-instruct"
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
  "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"
