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

TSDIAPI provides multiple approaches for error handling:

### 1. Standard Error Handling

The basic approach using standard HTTP status codes:

```typescript
useRoute("contacts")
    .get("/")
    .version('1')
    .code(200, Type.Object({ data: Type.Array(ContactSchema) }))
    .code(400, Type.Object({ error: Type.String() }))
    .code(404, Type.Object({ error: Type.String() }))
    .handler(async (req) => {
        // Implementation
    });
```

### 2. Response Codes Builder

A more convenient way to register multiple response codes at once:

```typescript
import { buildResponseCodes } from "@tsdiapi/server";

useRoute("contacts")
    .get("/")
    .version('1')
    .codes(buildResponseCodes(Type.Array(ContactSchema)))
    .handler(async (req) => {
        // Implementation
    });
```

This automatically registers standard response codes (200, 400, 401, 403, 404, 409, 422, 429, 500, 503) with the provided schema.

### 3. Typed Error Responses

For more type-safe error handling, you can use the provided error response classes:

```typescript
import { 
    ResponseBadRequest,
    ResponseNotFound,
    ResponseUnauthorized,
    // ... other error types
} from "@tsdiapi/server";

const handler = async (req: FastifyRequest) => {
    try {
        // Your implementation
    } catch (error) {
        throw new ResponseBadRequest("Invalid contact data");
    }
}

useRoute("contacts")
    .post("/")
    .version('1')
    .codes(buildResponseCodes(ContactSchema))
    .handler(handler);
```

### 4. Custom Error Schemas

You can define custom error schemas for more detailed error responses:

```typescript
import { useResponseErrorSchema } from "@tsdiapi/server";

const ValidationErrorSchema = Type.Object({
    field: Type.String(),
    message: Type.String()
});

const { register: errorRegister, send: sendError } = useResponseErrorSchema(400, ValidationErrorSchema);
const { register: successRegister, send: sendSuccess } = useResponseSchema(200, ContactSchema);
useRoute("contacts")
    .post("/")
    .version('1')
    .code(...successRegister)
    .code(...errorRegister)
    .handler(async (req) => {
        try {
            sendSuccess(req.body);
        } catch (error) {
            throw sendError("Validation failed", { 
                field: "email", 
                message: "Invalid email format" 
            });
        }
    });
```

### 5. Combined Response Schemas

For a more integrated approach, you can use `useResponseSchemas` to handle both success and error responses:

```typescript
import { useResponseSchemas } from "@tsdiapi/server";

const ContactSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

const ValidationErrorSchema = Type.Object({
    field: Type.String(),
    message: Type.String()
});

const { codes, sendError, sendSuccess, send } = useResponseSchemas(
    ContactSchema,
    ValidationErrorSchema
);

useRoute("contacts")
    .post("/")
    .version('1')
    .codes(codes)
    .handler(async (req) => {
        try {
            // Success case
            const contact = await createContact(req.body);
            return sendSuccess(contact);
            
            // Or using the combined send function
            // return send(contact);
        } catch (error) {
            // Error case
            return sendError("Validation failed", {
                field: "email",
                message: "Invalid email format"
            });
            
            // Or using the combined send function
            // return send({ error: "Validation failed", details: { field: "email", message: "Invalid email format" } });
        }
    });
```

The `useResponseSchemas` function provides:
- `codes`: Pre-configured response codes for both success and error cases
- `sendError`: Function to send error responses
- `sendSuccess`: Function to send success responses
- `send`: Combined function that can handle both success and error responses

### 6. Response Helpers

For quick response creation, use the provided helper functions:

```typescript
import { 
    response200,
    response400,
    // ... other helpers
} from "@tsdiapi/server";

useRoute("contacts")
    .get("/:id")
    .version('1')
    .codes(buildResponseCodes(ContactSchema))
    .handler(async (req) => {
        const contact = await findContact(req.params.id);
        if (!contact) {
            return response400("Contact not found");
        }
        return response200(contact);
    });
```

### Best Practices

1. Use appropriate HTTP status codes for different error types
2. Include detailed error information in responses
3. Use TypeBox schemas for error response validation
4. Implement proper error logging
5. Handle both synchronous and asynchronous errors
6. Use typed error responses for better type safety
7. Consider using the response codes builder for standard endpoints
8. Use custom error schemas when you need detailed error information

## Best Practices

1. Use TypeBox schemas for configuration and validation
2. Organize code into feature modules
3. Use dependency injection for services
4. Implement proper error handling
5. Document your API with OpenAPI/Swagger

