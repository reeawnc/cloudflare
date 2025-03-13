# Middleware

This project provides a middleware library for handling API key authentication in a server environment.

## Table of Contents
- [Overview](#overview)
- [Usage](#usage)
- [Architecture](#architecture)

## Overview
The middleware library is designed to authenticate API requests by verifying the presence and validity of an API key. It is intended to be used in server environments where API key authentication is required to protect resources.

## Usage
To use the middleware, import the `authApiKey` function from the library and apply it to your server's request handling pipeline. The middleware checks for the presence of an `x-api-key` header and compares it against a predefined API key stored in the environment variables.

### Importing the Middleware
```javascript
import { authApiKey } from '../../../libs/middleware/src/auth-api-key';
```

### Applying the Middleware
The middleware should be used in a server context where you can pass the request context and a next function to proceed with the request handling.

## Architecture
The middleware is a simple function that checks the environment for the API key and compares it with the incoming request's API key header. If the keys match, the request is allowed to proceed; otherwise, an error response is returned.

This project does not include any complex architecture or diagrams as it is a standalone library function.