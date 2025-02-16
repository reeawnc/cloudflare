# Workers AI Monorepo

This repository is a monorepo that houses a comprehensive collection of applications, libraries, and workers built around artificial intelligence and modern web technologies. It is structured to support multiple packages (apps, workers, and libs) and utilises advanced tooling for code generation, testing, deployment, and type safety.

## Overview

The primary objective of this repository is to provide a scalable and maintainable codebase for projects that integrate advanced AI features. The repository leverages Nx for project management and includes generators to rapidly create new applications and workers. It also integrates continuous integration (CI) and deployment pipelines with GitHub Actions, ensuring rigorous testing and deployment processes across different environments.

## Repository Structure

The repository organisation is as follows:

- **apps/** – Contains front-end applications such as the chat interface.
- **workers/** – Includes backend worker projects (e.g. chat server, tool call verification).
- **libs/** – Holds shared libraries such as logger and utilities.
- **.github/workflows/** – Contains CI and production deployment workflows.
- **scripts/** – Provides code generation scripts and utility scripts for project maintenance.
- **tsconfig.\*** – Multiple TypeScript configuration files to simplify development for different targets:
  - `tsconfig.base.json` – Common compiler options shared across all projects.
  - `tsconfig.browser.json` – Configurations for browser-based apps.
  - `tsconfig.node.json` – Configurations for Node.js-based tooling.
  - `tsconfig.workerd.json` – Configurations for workers running on Workerd.

This modular structure, especially the tailored tsconfig files, enables individual packages, apps, and workers to be developed and type-checked in isolation while still maintaining a coherent overall configuration.

## Unique Aspects

- **TypeScript Configuration**:
  The repository uses a multi-tiered tsconfig structure to simplify the configuration of individual packages. By centralising common compiler options in `tsconfig.base.json` and extending it in target-specific configurations (e.g. for browsers, Node.js, and Workerd), the repository ensures consistency while accommodating the specific needs of different projects.

- **Generators**:
  Custom generators are provided to streamline the creation of new applications and workers. For example:
  - `npm run generate-app` invokes a generator that copies and processes an app template, updates the relevant tsconfig file, and provides instructions on how to run the new app.
  - `npm run generate-worker` similarly creates a new worker project with predefined scripts, configurations, and a customised tsconfig for workers.

- **CI/CD Integration**:
  GitHub Actions workflows in the `.github/workflows` directory handle automated testing, linting, type-checking, and deployment for both staging and production environments. The CI workflow ensures that code pushed to the `main` branch or created via pull requests passes all quality checks before merging. Production deployments are triggered by pushes to the `production` branch or manually via GitHub’s UI.

## Continuous Integration

The repository employs two main GitHub Actions workflows:

- **CI Workflow (`ci.yml`)**:
  - Triggered on pushes to the `main` branch and on pull requests.
  - Checks out the repository, sets up Node.js with caching for npm dependencies, installs dependencies, and executes Nx tasks including linting, testing, type-checking, building, and deploying to a staging environment.
  - For pull requests, a comment is automatically posted with the staging deploy URLs using a dedicated script.

- **Production Deployment Workflow (`deploy-prod.yml`)**:
  - Triggered on pushes to the `production` branch or via manual invocation.
  - Similar to the CI workflow but specifically executes tasks for production deployment.

## Usage

### Running the Repository Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/ai-mono.git
   cd ai-mono
   ```

2. **Install Dependencies**
   Use npm to install the dependencies:
   ```bash
   npm ci
   ```

3. **Run a Specific Application or Worker**
   For example, to run the chat application:
   ```bash
   cd apps/chat
   npm run dev
   ```

4. **Running Tests and Type Checks**
   From the repository root, you can run:
   ```bash
   npx nx affected:test
   npx nx affected:type-check
   ```

### Using the Generators

The repository includes generators to quickly scaffold new projects:

- **Generate an Application**
  Run:
  ```bash
  npm run generate-app
  ```
  You will be prompted for the new project location and project name. The generator will copy the app template, process Handlebars templates, and update the relevant `tsconfig` files.

- **Generate a Worker**
  Run:
  ```bash
  npm run generate-worker
  ```
  This will similarly prompt for project details, copy the worker template, and update the worker-specific tsconfig.

## Contributing

Contributions are welcome and appreciated. To contribute:

1. **Fork and Clone**
   Fork the repository and clone it locally.

2. **Create a Branch**
   Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Implement Changes**
   Make your changes ensuring that:
   - Code is thoroughly tested.
   - New features include appropriate tests.
   - TypeScript strict type checking is maintained.

4. **Commit and Push**
   Commit your changes with clear messages:
   ```bash
   git commit -am "Add feature: my new feature"
   git push origin feature/my-new-feature
   ```

5. **Create a Pull Request**
   Open a pull request against the `main` branch and follow the guidelines in the repository.

## Licence

This project is licensed under the [MIT License](LICENSE).

---

For further details, please consult the individual documentation within each package, application, or worker.
