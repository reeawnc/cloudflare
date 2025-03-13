# Utils

A utility library providing a finite state machine (FSM) generator with type-safe transitions and hooks.

## Table of Contents
- [Overview](#overview)
- [Usage](#usage)
- [Architecture](#architecture)

## Overview
The `utils` library is designed to facilitate the creation of finite state machines (FSMs) with type-safe transitions and lifecycle hooks. It allows developers to define states, transitions, and hooks for entering and exiting states, supporting both synchronous and asynchronous operations.

## Usage
To use the `utils` library, you can import the `generateMachine` function and define your FSM configuration. Here's a basic example:

```typescript
import { generateMachine } from '../../../libs/utils/src/fsm';

const config = {
  init: 'idle',
  transitions: [
    { action: 'start', from: 'idle', to: 'running' },
    { action: 'finish', from: 'running', to: 'completed' },
  ],
};

const machine = generateMachine(config);
await machine.start();
console.log(machine.state); // running
await machine.finish();
console.log(machine.state); // completed
```

### NPM Scripts
- `test`: Runs the test suite using Vitest.
  ```bash
  npx nx test utils
  ```
- `test:ci`: Runs the test suite in continuous integration mode (without watch mode).
  ```bash
  npx nx test:ci utils
  ```

## Architecture
The `utils` library is structured around a core function, `generateMachine`, which constructs a state machine based on a given configuration. The configuration includes initial states, transitions, and optional lifecycle hooks. The library ensures that transitions are executed sequentially, even when invoked concurrently, by using a mutex pattern to queue transitions.