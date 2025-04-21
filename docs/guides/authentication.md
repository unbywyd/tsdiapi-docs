# Authentication Guide

This guide covers authentication setup and usage in TSDIAPI.

## 🚀 Quick Start

1. **Install JWT Authentication Plugin**:
   ```bash
   tsdiapi plugins add jwt-auth
   ```
   This command will:
   - Install the JWT authentication plugin
   - Set up necessary configuration
   - Add required environment variables

2. **Configure Environment Variables**:
   ```env
   JWT_SECRET_KEY=your-secret-key
   JWT_EXPIRATION_TIME=604800  # 7 days in seconds
   ```

## 🔐 Authentication Types

TSDIAPI supports three authentication methods:

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

#### Protected Route Example
```typescript
import { JWTGuard } from "@tsdiapi/jwt-auth";

useRoute("feature")
    .get("/protected")
    .auth("bearer")
    .guard(JWTGuard({ guardName: 'adminOnly' }))
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(401, Type.Object({
        error: Type.String()
    }))
    .handler(async (req) => {
        // Access user data from JWT
        const userId = req.user.id;
        return { status: 200, data: { userId } };
    })
    .build();
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
    .auth("apiKey")
    .guard(APIKeyGuard({ guardName: 'reportService' }))
    .code(200, Type.Object({
        from: Type.String(),
        key: Type.String(),
    }))
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

## 🔑 JWT Authentication Details

### 1. Token Generation
```typescript
import { useJWTAuthProvider } from "@tsdiapi/jwt-auth";

// In your login route
useRoute("auth")
    .post("/login")
    .body(Type.Object({
        username: Type.String(),
        password: Type.String()
    }))
    .handler(async (req) => {
        const { username, password } = req.body;
        const user = await validateUser(username, password);
        
        if (!user) {
            return {
                status: 401,
                data: { error: "Invalid credentials" }
            };
        }

        const authProvider = useJWTAuthProvider();
        const token = await authProvider.signIn({
            id: user.id,
            role: user.role
        });

        return {
            status: 200,
            data: { token }
        };
    })
    .build();
```

### 2. Token Validation
```typescript
useRoute("auth")
    .get("/verify")
    .auth("bearer")
    .guard(JWTGuard())
    .handler(async (req) => {
        const authProvider = useJWTAuthProvider();
        const session = await authProvider.verify<{ id: string; role: string }>(req.token);
        
        if (!session) {
            return {
                status: 401,
                data: { error: "Invalid token" }
            };
        }

        return {
            status: 200,
            data: { 
                userId: session.id, 
                role: session.role 
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