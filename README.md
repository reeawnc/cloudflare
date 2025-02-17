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
