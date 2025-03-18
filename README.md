# Cloudflare AI

This repository contains various packages and apps related consuming Cloudflare's AI offerings on the client-side. It is a monorepo powered by [Nx](https://nx.dev/) and [Changesets](https://github.com/changesets/changesets).

## What's in the Repo

```
- demos [Apps that demonstrate Cloudflare AI capabilities]
- libs [Shared libraries for demos and packages]
- packages [Packages that can be published to npm]
```

### Packages

- [`workers-ai-provider`](./packages/workers-ai-provider/README.md): A custom provider that enables [Workers AI](https://ai.cloudflare.com/)'s models for the [Vercel AI SDK](https://sdk.vercel.ai/).

## Local Development

1. Clone the repository.

   ```bash
   git clone git@github.com:cloudflare/ai.git
    ```
   
2. Install Dependencies.

   From the root directory, run:

   ```bash
   cd ai
   npm install
   ```

3. Develop.

   To start a development server for a specific app (for instance, `tool-calling`):

   ```bash
   npx nx dev tool-calling
   ```

   *Ideally all commands should be executed from the repository root with the `npx nx` prefix. This will ensure that the dependency graph is managed correctly, e.g. if one package relies on the output of an other.*

4. Testing and Linting.

  - To execute your continuous integration tests for a specific project (e.g., `workers-ai-provider`):

    ```bash
    npx nx test:ci workers-ai-provider
    ```

  - To lint a specific project:

    ```bash
    npx nx lint my-project
    ```

  - To run a more comprehensive sweep of tasks (lint, tests, type checks, build) against one or more projects:

    ```bash
    npx nx run-many -t lint test:ci type-check build -p "my-project other-project"
    ```

5. Other Nx Tasks.

  - `build`: Compiles a project or a set of projects.
  - `test`: Runs project tests in watch mode.
  - `test:ci`: Runs tests in CI mode (no watch).
  - `test:smoke`: Runs smoke tests.
  - `type-check`: Performs TypeScript type checks.

## Contributing

We appreciate contributions and encourage pull requests. Please follow these guidelines:

1. Project Setup: After forking or cloning, install dependencies with `npm install`.
2. Branching: Create a new branch for your feature or fix.
3. Making Changes:
  - Add or update relevant tests.
  - On pushing your changes, automated tasks will be run (courtesy of a Husky pre-push hook).
4. Changesets: If your changes affect a published package, run `npx changeset` to create a changeset. Provide a concise summary of your changes in the changeset prompt.
5. Pull Request: Submit a pull request to the `main` branch. The team will review it and merge if everything is in order.

## Release Process

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publication:

1. **Changeset Creation**: Whenever a change is made that warrants a new release (e.g., bug fixes, new features), run:

   ```bash
   npx changeset
   ```

   Provide a clear description of the changes.

2. **Merging**: Once the changeset is merged into `main`, our GitHub Actions workflows will:
  - Detect the changed packages, and create a Version Packages PR.
  - Increment versions automatically (via Changesets).
  - Publish any package that has a version number to npm. (Demos and other internal items do not require versioning.)

3. **Publication**: The release workflow (`.github/workflows/release.yml`) will run on every push to `main`. It ensures each published package is tagged and released on npm. Any package with a version field in its `package.json` will be included in this process.

## Various Repo Notes

### Hoisted Dependencies

In this monorepo, we rely on hoisting to place common dependencies in the root `node_modules`, thereby simplifying version management. This practice means:

- Shared dependencies appear only once at the root.
- Individual package or library directories usually contain only project-specific dependencies.

Should you encounter version conflicts or require specific dependency versions, adjustments can be made on a per-package basis, but in general, we keep everything consolidated at the root wherever possible.

### Relative paths

In this monorepo, relative paths are used for imports in order to simplify the tool-chain. This means that when you import a module, you should use the relative path from the file where you're importing it. For example:

```ts
import { myFunction } from '../my-package/src/myFunction';
```

### TSConfig

There are several `tsconfig` files at the root that cover the various environments that each package or file is supposed to run in. In most cases, this means that you don't need a tsconfig in each package, but sometimes it's unavoidable, especially in published packages.

The way that it is setup, each file by default is included in the `tsconfig.node.json` config. So this will apply to everything in the package. If the `src` for the package is not supposed to run in Node, then you can add it to the relevant `tsconfig`. For example:

```txt
- my-browser-based-app
  - src
    - index.ts
  some-node-config-or-script.ts
  package.json
```
Here, the `some-node-config-or-script.ts` file falls correctly under the `tsconfig.node.json` config, but we can add the `src` folder to the `tsconfig.browser.json` config.

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    ...
  },
  "include": [
    "./demos/my-browser-based-app/src/client/**/*.ts",
    "./demos/my-browser-based-app/src/client/**/*.tsx",
  ]
}
```

---

For any queries or guidance, kindly open an issue or submit a pull request. We hope this structure and process help you to contribute effectively.

