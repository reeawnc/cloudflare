# Logger

A simple logging library for Node.js applications, providing methods to log messages with different levels of severity: success, info, warn, and error.

## Table of Contents
- [Overview](#overview)
- [Usage](#usage)
- [Architecture](#architecture)

## Overview
The Logger library is designed to provide a simple and consistent way to log messages in Node.js applications. It offers four logging levels: success, info, warn, and error, each with a distinct color for easy identification in the console. The library is implemented in TypeScript and can be easily integrated into any Node.js project.

## Usage
To use the Logger library, you need to import the `log` object from the library and use its methods to log messages. Here is an example of how to import and use the Logger library:

```typescript
import { log } from '../../../libs/logger/src/logger';

log.success('This is a success message');
log.info('This is an info message');
log.warn('This is a warning message');
log.error('This is an error message');
```

### NPM Scripts
- `test`: Runs the test suite using Vitest.
- `test:ci`: Runs the test suite in continuous integration mode using Vitest.

To execute these scripts, use the following commands:
- `npx nx test logger`
- `npx nx test:ci logger`

## Architecture
The Logger library is a standalone module that can be imported and used in any Node.js application. It is implemented in TypeScript and consists of a main logger file (`logger.ts`) and a types definition file (`types.ts`). The logger functions are designed to output messages to the console with timestamps and colored text for better readability.