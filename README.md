# AI Mono Repository

This repository is a monorepo managed with [Nx](https://nx.dev). It contains multiple apps, workers, and libraries that work together to deliver AI-powered features. The repository provides generators, standardised commands, and deployment workflows for efficient development and continuous integration.

## Usage

### Generating a New Worker

To generate a new worker:

1. Run the worker generator:
   ```bash
   npm run generate-app
   ```
2. When prompted, you'll be asked a few things like the name and type of worker, and the Vercel AI SDK provider you want to use.
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
  # with watch mode
  npx nx test [name-of-worker]
  ```
  ```bash
  # without watch mode
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
