# Error Handling Guide

This guide covers error handling in TSDIAPI applications.

## 🚀 Basic Error Handling

### 1. Route-Level Error Handling

```typescript
useRoute("feature")
    .get("/error-example")
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(400, Type.Object({
        error: Type.String()
    }))
    .code(500, Type.Object({
        error: Type.String(),
        code: Type.String()
    }))
    .handler(async (req) => {
        try {
            // Your code here
            return { status: 200, data: { /* ... */ } };
        } catch (error) {
            return {
                status: 500,
                data: { 
                    error: error.message,
                    code: "INTERNAL_ERROR"
                }
            };
        }
    })
    .build();
```

### 2. Global Error Handler

```typescript
useRoute("feature")
    .get("/global-error")
    .setErrorHandler((error, req, reply) => {
        // Custom error handling logic
        reply.status(500).send({
            status: 500,
            data: { 
                error: error.message,
                code: "CUSTOM_ERROR"
            }
        });
    })
    .build();
```

## 🔐 Error Hooks

TSDIAPI provides several hooks for error handling:

### 1. onError Hook
```typescript
useRoute("feature")
    .get("/error-hook")
    .onError((error, req, reply) => {
        // Handle specific route errors
        console.error(`Error in route: ${error.message}`);
    })
    .build();
```

### 2. preValidation Hook
```typescript
useRoute("feature")
    .get("/validation")
    .preValidation((req, reply) => {
        if (!req.headers.authorization) {
            return {
                status: 401,
                data: { error: "Unauthorized" }
            };
        }
        return true;
    })
    .build();
```

## 📦 Error Types

### 1. Validation Errors
```typescript
useRoute("feature")
    .post("/validate")
    .body(Type.Object({
        name: Type.String(),
        age: Type.Number()
    }))
    .code(400, Type.Object({
        error: Type.String(),
        details: Type.Array(Type.String())
    }))
    .handler(async (req) => {
        if (!req.body.name) {
            return {
                status: 400,
                data: {
                    error: "Validation failed",
                    details: ["Name is required"]
                }
            };
        }
        return { status: 200, data: { success: true } };
    })
    .build();
```

### 2. Authentication Errors
```typescript
useRoute("feature")
    .get("/protected")
    .auth("bearer")
    .code(401, Type.Object({
        error: Type.String(),
        code: Type.String({ const: "UNAUTHORIZED" })
    }))
    .code(403, Type.Object({
        error: Type.String(),
        code: Type.String({ const: "FORBIDDEN" })
    }))
    .build();
```

### 3. File Upload Errors
```typescript
useRoute("feature")
    .post("/upload")
    .acceptMultipart()
    .fileOptions({
        maxFileSize: 1024 * 1024 * 5, // 5MB
        accept: ["image/jpeg", "image/png"]
    })
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .build();
```

## 🔒 Best Practices

1. **Use Appropriate Status Codes**:
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error

2. **Include Error Details**:
   ```typescript
   .code(400, Type.Object({
       error: Type.String(),
       code: Type.String(),
       details: Type.Optional(Type.Array(Type.String()))
   }))
   ```

3. **Handle Async Errors**:
   ```typescript
   .handler(async (req) => {
       try {
           await someAsyncOperation();
       } catch (error) {
           return {
               status: 500,
               data: {
                   error: error.message,
                   code: "ASYNC_ERROR"
               }
           };
       }
   })
   ```

4. **Use Guards for Error Prevention**:
   ```typescript
   .guard(async (req) => {
       if (!req.user) {
           return {
               status: 401,
               data: { error: "User not authenticated" }
           };
       }
       return true;
   })
   ```

## ⚠️ Common Error Scenarios

1. **Validation Errors**:
   ```typescript
   .code(400, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "VALIDATION_ERROR" }),
       details: Type.Array(Type.String())
   }))
   ```

2. **Authentication Errors**:
   ```typescript
   .code(401, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "AUTH_ERROR" })
   }))
   ```

3. **File Upload Errors**:
   ```typescript
   .code(400, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "FILE_ERROR" }),
       details: Type.Array(Type.String())
   }))
   ```

4. **Database Errors**:
   ```typescript
   .code(500, Type.Object({
       error: Type.String(),
       code: Type.String({ const: "DB_ERROR" })
   }))
   ```

## 📚 Additional Resources

- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Fastify Error Handling](https://www.fastify.io/docs/latest/Reference/Errors/)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox) 