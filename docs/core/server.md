# Server Guide

TSDIAPI's server component provides a powerful and flexible foundation for building APIs. This guide covers the core server features and how to use them effectively.

## Server Features

- Fastify-based HTTP server
- TypeScript-first development
- Dependency injection with TypeDI
- TypeBox schema validation
- Plugin system
- Swagger/OpenAPI integration

## Basic Setup

The `createApp` function is the entry point for creating a TSDIAPI server. It provides a powerful and flexible way to configure your application:

```typescript
import { createApp } from '@tsdiapi/server';
import { Type } from '@sinclair/typebox';
import { PrismaClient } from "@generated/prisma/client.js";
import PrismaPlugin from "@tsdiapi/prisma";

// Define configuration schema
const ConfigSchema = Type.Object({
    PORT: Type.Number({ default: 3000 }),
    HOST: Type.String({ default: 'localhost' }),
    DATABASE_URL: Type.String()
});

type Config = Static<typeof ConfigSchema>;
```
	
```typescript
// main.ts
// Create and start the application
const app = await createApp<Config>({
    // Basic configuration
    apiDir: './api',                    // Directory containing API controllers
    configSchema: ConfigSchema,          // TypeBox schema for environment variables
    logger: true,                        // Enable Fastify logger
    
    // Fastify configuration
    fastifyOptions: (defaults) => ({
        ...defaults,
        trustProxy: true
    }),
    
    // Security configuration
    corsOptions: {
        origin: ['https://myapp.com'],
        credentials: true
    },
    helmetOptions: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"]
            }
        }
    },
    
    // Documentation configuration
    swaggerOptions: {
        openapi: {
            info: {
                title: 'My API',
                version: '1.0.0'
            }
        }
    },
    
    // Plugins
    plugins: [PrismaPlugin({ client: PrismaClient })],
    
    // Lifecycle hooks
    onInit: async (ctx) => {
        console.log('Initializing application...');
    },
    afterStart: async (ctx) => {
        console.log(`Server started on ${ctx.fastify.server.address()}`);
    }
});

console.log(`Server running at http://${app.config.HOST}:${app.config.PORT}`);
```

### Configuration Options

The `createApp` function accepts the following configuration options:

1. **Basic Configuration**:
   - `apiDir`: Directory containing your API controllers and services
   - `configSchema`: TypeBox schema for validating configuration
   - `logger`: Enable/disable Fastify logger
   - `fileLoader`: Custom file loader for handling uploads
   - `plugins`: Array of plugins to use

2. **Fastify Configuration**:
   - `fastifyOptions`: Customize Fastify server options
   - `corsOptions`: Configure CORS
   - `helmetOptions`: Configure security headers
   - `swaggerOptions`: Configure OpenAPI documentation
   - `swaggerUiOptions`: Configure Swagger UI
   - `staticOptions`: Configure static file serving
   - `multipartOptions`: Configure multipart form handling

3. **Lifecycle Hooks**:
   - `onInit`: Called when the app is initialized
   - `beforeStart`: Called before the server starts
   - `preReady`: Called before the server is ready
   - `afterStart`: Called after the server starts

### AppContext

The `AppContext` object is available in lifecycle hooks and plugins, providing access to:

```typescript
interface AppContext<T> {
    fastify: FastifyInstance;          // Fastify server instance
    environment: 'production' | 'development';
    appDir: string;                    // Application directory
    options: AppOptions<T>;            // Application options
    fileLoader?: FileLoader;           // File loader function
    projectConfig: AppConfig<T>;       // Project configuration
    projectPackage: Record<string, any>; // Package.json contents
    plugins?: Record<string, AppPlugin>; // Loaded plugins
    useRoute: RouteBuilder;            // Route builder function
}
```

## Server Configuration

The server configuration is defined using TypeBox schemas for environment variables. This schema serves several important purposes:

1. **Environment Variable Validation**: Validates that all required environment variables are present and have correct types
2. **Type Safety**: Provides full TypeScript type checking for configuration
3. **Documentation**: Documents required environment variables
4. **Transformation**: Automatically transforms environment variables to correct types

### Basic Configuration Schema

```typescript
import { Type, Static } from '@sinclair/typebox';

const ConfigSchema = Type.Object({
    // Required variables
    PORT: Type.Number({ default: 3000 }),
    HOST: Type.String({ default: 'localhost' }),
    DATABASE_URL: Type.String()
});

type Config = Static<typeof ConfigSchema>;
```

### Environment Variable Transformation

The schema automatically handles type transformations:

```env
PORT=3000                    // Will be transformed to number
ENABLE_CACHE=true           // Will be transformed to boolean
```

### Using the Configuration

The configuration is automatically loaded and validated when the application starts. You can access it through the `AppContext`:

```typescript
createApp<Config>({
    configSchema: ConfigSchema,
    onInit: async (ctx) => {
        // Access configuration
        const port = ctx.projectConfig.get('PORT', 3000);
        const host = ctx.projectConfig.get('HOST', 'localhost');
        console.log(`Server will run on ${host}:${port}`);
    }
});
```

### Common Environment Variables

```env
PORT=3000              # Server port
HOST=localhost         # Server host
APP_NAME=MyApp        # Application name
APP_VERSION=1.0.0     # Application version
DATABASE_URL=...      # Database connection string
```

## Feature Modules

Create feature modules to organize your API:

```typescript
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

const UserSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

export default function UsersModule({ useRoute }: AppContext): void {
    useRoute("users")
        .get("/:id")
        .summary("Get user by ID")
        .description("Retrieves user information by ID")
        .tags(["Users"])
        .params(Type.Object({ id: Type.String() }))
        .code(200, UserSchema)
        .code(404, Type.Object({ error: Type.String() }))
        .handler(async (req) => {
            // Implementation
        })
        .build();
}
```

## Services and Dependency Injection

Use TypeDI for dependency injection:

```typescript
import { Service } from 'typedi';

@Service()
class UserService {
    async findById(id: string) {
        // Implementation
    }
}

// Use in route handler
useRoute()
    .get('/users/:id')
    .handler(async (req) => {
        const userService = Container.get(UserService);
        return userService.findById(req.params.id);
    });
```

## Error Handling

TSDIAPI provides multiple levels of error handling:

### 1. Global Error Handler
```typescript
app.setErrorHandler((error, request, reply) => {
    // Custom error handling
    reply.status(500).send({
        error: error.message,
        code: "INTERNAL_ERROR"
    });
});
```

### 2. Route-Level Error Handling
```typescript
useRoute("feature")
    .get("/example")
    .code(200, Type.Object({ data: Type.Any() }))
    .code(400, Type.Object({ error: Type.String() }))
    .code(500, Type.Object({ error: Type.String(), code: Type.String() }))
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

### 3. Error Hooks
```typescript
useRoute("feature")
    .get("/error-hook")
    .onError((error, req, reply) => {
        // Handle specific route errors
        console.error(`Error in route: ${error.message}`);
    })
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

### Common Error Types
- **Validation Errors** (400): Input validation failures
- **Authentication Errors** (401/403): Authentication/authorization issues
- **File Upload Errors** (400): File upload validation failures
- **Database Errors** (500): Database operation failures

### Best Practices
1. Use appropriate HTTP status codes
2. Include detailed error information
3. Implement proper error logging
4. Use TypeBox schemas for error response validation
5. Handle both synchronous and asynchronous errors

## Best Practices

1. Use TypeBox schemas for configuration and validation
2. Organize code into feature modules
3. Use dependency injection for services
4. Implement proper error handling
5. Document your API with OpenAPI/Swagger

