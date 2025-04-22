# Authentication Guide

[![npm version](https://badge.fury.io/js/%40tsdiapi%2Fjwt-auth.svg)](https://badge.fury.io/js/%40tsdiapi%2Fjwt-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TSDIAPI-JWT-Auth** is a plugin for the `TSDIAPI-Server` framework that simplifies JWT-based authentication and authorization. It includes utilities for token creation, session validation, and custom guards to secure API endpoints effectively.

## Features

- **Token Management**: Generate and verify JWT tokens with customizable payloads and expiration times.
- **Session Protection**: Use built-in or custom session validation logic for secure API access.
- **Custom Guards**: Easily register and reference multiple guards to support various security requirements.
- **Environment Integration**: Supports configuration through `.env` files to streamline deployment.

## 🚀 Quick Start

1. **Install JWT Authentication Plugin**:
   ```bash
   npm install @tsdiapi/jwt-auth
   ```
   Or use the CLI:
   ```bash
   tsdiapi plugins add jwt-auth
   ```

2. **Configure Environment Variables**:
   ```env
   JWT_SECRET_KEY=your-secret-key
   JWT_EXPIRATION_TIME=604800  # 7 days in seconds
   ```

## 🔐 Authentication Types

### 1. Bearer Token Authentication (Recommended for JWT)

```typescript
import createPlugin from "@tsdiapi/jwt-auth";
import { createApp } from "@tsdiapi/server";

createApp({
  plugins: [
    createPlugin({
      secretKey: "your-secret-key", // Use JWT_SECRET_KEY in .env as an alternative
      expirationTime: 60 * 60 * 24 * 7, // Token valid for 7 days
      guards: {
        adminOnly: async (session) => {
          if (session.role !== "admin") {
            return "Only administrators are allowed!";
          }
          return true;
        }
      }
    })
  ]
});
```

## 🔒 Protecting Endpoints

**Important Rules for Route Definition:**
1. Every route using guards **MUST** define a 403 response code with the following schema:
   ```typescript
   .code(403, Type.Object({
       error: Type.String(),
   }))
   ```
2. Response codes (`code()`) must be defined immediately after the HTTP method (get, post, etc.)
3. Authentication (`auth()`) and guards (`guard()`) should be defined after response codes
4. The handler should be defined last

### Example of Correct Route Definition
```typescript
useRoute("feature")
    .get("/protected")
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .auth("bearer")
    .guard(JWTGuard({ guardName: 'adminOnly' }))
    .handler(async (req) => {
        const userId = req.user.id;
        return { status: 200, data: { userId } };
    })
    .build();
```

### Applying the `JWTGuard`

Secure API endpoints using `JWTGuard`. You can use it in two ways:

1. For standard bearer token validation:
```typescript
useRoute()
  .get('/protected/endpoint')
  .code(200, Type.Object({
      message: Type.String(),
  }))
  .code(403, Type.Object({
      error: Type.String(),
  }))
  .auth('bearer')
  .guard(JWTGuard())
  .handler(async (req) => {
    return {
      status: 200,
      data: { message: 'Access granted' }
    }
  })
  .build();
```

2. For custom guard validation:
```typescript
useRoute()
  .get('/admin/dashboard')
  .code(200, Type.Object({
      message: Type.String(),
  }))
  .code(403, Type.Object({
      error: Type.String(),
  }))
  .auth('bearer')
  .guard(JWTGuard({ guardName: 'adminOnly' }))
  .handler(async (req) => {
    return {
      status: 200,
      data: { message: 'Welcome to admin dashboard' }
    }
  })
  .build();
```

**Note:** Make sure you have registered the guard with the same name (`adminOnly` in this example) during plugin initialization when using custom guards.

### Registering Custom Guards

You can register custom guards during plugin initialization. These guards can later be referenced by name:

```typescript
createApp({
  plugins: [
    createPlugin({
      secretKey: "your-secret-key",
      guards: {
        adminOnly: async (session) => {
          if (session.role !== "admin") {
            return "Only administrators are allowed!";
          }
          return true;
        },
      },
    }),
  ],
});
```

### 2. Using JWT Auth Provider

The `JWTAuthProvider` is the core service for handling JWT-based authentication:

```typescript
import { useJWTAuthProvider } from "@tsdiapi/jwt-auth";

// Sign in and generate token
const authProvider = useJWTAuthProvider();
const token = await authProvider.signIn({
    userId: "123",
    role: "admin"
});

// Verify token
const session = await authProvider.verify<{ userId: string; role: string }>(token);
if (session) {
    console.log("Authenticated User:", session.userId);
}
```

### 3. Basic Authentication

```typescript
useRoute("feature")
    .get("/basic-protected")
    .code(200, Type.Object({
        message: Type.String()
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .auth("basic", async (req) => {
        const auth = req.headers.authorization;
        if (!auth) {
            return {
                status: 401,
                data: { error: "No credentials provided" }
            };
        }
        const [username, password] = Buffer.from(auth.split(' ')[1], 'base64')
            .toString()
            .split(':');
        
        const isValid = await validateCredentials(username, password);
        if (!isValid) {
            return {
                status: 401,
                data: { error: "Invalid credentials" }
            };
        }
        return true;
    })
    .build();
```

### 4. API Key Authentication

```typescript
useRoute("feature")
    .get("/api-key-protected")
    .code(200, Type.Object({
        from: Type.String(),
        key: Type.String(),
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .auth("apiKey")
    .guard(APIKeyGuard({ guardName: 'reportService' }))
    .handler(async (req) => {
        return {
            status: 200,
            data: { 
                from: 'APIKey session', 
                key: req.session.apiKey 
            }
        };
    })
    .build();
```

## 🔒 Security Best Practices

1. **Token Storage**:
   - Store JWT_SECRET_KEY securely
   - Use environment variables
   - Never commit secrets to version control

2. **Token Expiration**:
   - Set reasonable expiration times
   - Use refresh tokens for long-lived sessions
   - Implement token revocation

3. **Password Security**:
   - Use strong password hashing
   - Implement rate limiting
   - Require password complexity

4. **API Key Security**:
   - Rotate API keys regularly
   - Use key prefixes for identification
   - Implement key revocation

5. **Custom Guards**:
   - Implement role-based access control
   - Validate session data
   - Handle edge cases

## API Reference

### Plugin Options

| Option           | Type                                      | Description                            |
| ---------------- | ----------------------------------------- | -------------------------------------- |
| `secretKey`      | `string`                                  | Secret key for signing JWT tokens.     |
| `expirationTime` | `number`                                  | Token expiration time in seconds.      |
| `guards`         | `Record<string, ValidateSessionFunction>` | Custom guards for validating sessions. |

## ⚠️ Common Issues

1. **Token Expired**:
   ```typescript
   .code(401, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "TOKEN_EXPIRED" })
   }))
   ```

2. **Invalid Token**:
   ```typescript
   .code(401, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "INVALID_TOKEN" })
   }))
   ```

3. **Missing Token**:
   ```typescript
   .code(401, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "MISSING_TOKEN" })
   }))
   ```

4. **Guard Validation Failed**:
   ```typescript
   .code(403, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "GUARD_VALIDATION_FAILED" })
   }))
   ```

## 📚 Additional Resources

- [JWT Documentation](https://jwt.io/introduction)
- [Fastify JWT Plugin](https://github.com/fastify/fastify-jwt)
- [OAuth 2.0 Specification](https://oauth.net/2/)

## License

This plugin is open-source and available under the [MIT License](LICENSE). 