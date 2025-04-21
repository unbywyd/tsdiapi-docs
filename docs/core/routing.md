# Routing

TSDIAPI provides a powerful and flexible routing system that leverages TypeScript's type safety and Fastify's performance.

## Automatic Route Loading

The TSDI API server automatically loads routes from specific files in your project during server initialization.

### File Naming Convention

The server looks for two types of files:
1. `*.module.ts` - Module files containing route definitions
2. `*.load.ts` - Loader files for additional route setup

### Module Structure

Each module file should export a default function that takes an `AppContext` as its parameter:

```typescript
// feature.module.ts
export default function FeatureModule({ useRoute }: AppContext): void {
    useRoute("feature")
        .get("/text")
        .text()
        .handler(async (req, res) => {
            return "Hello, world!";
        })
        .build();
}
```

### Loader Files

Loader files (`*.load.ts`) are used for:
- Setting up route middleware
- Configuring global route options
- Registering route hooks
- Setting up authentication strategies

```typescript
// auth.load.ts
export default function AuthLoader({ useRoute }: AppContext): void {
    // Setup authentication middleware
    useRoute("auth")
        .guard(async (req, res) => {
            // Global authentication logic
        });
}
```

## Basic Usage

The routing system provides a type-safe, fluent API for defining routes. Here's a basic example:

```typescript
export default function FeatureModule({useRoute}: AppContext): void {
    useRoute("feature")
        .get("/")
        .code(200, Type.Object({
            message: Type.String()
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .code(403, Type.Object({
            error: Type.String()
        }))
        .handler(async (req, res) => {
            const service = Container.get(FeatureService);
            const hello = await service.getHello();
            return {
                status: 200,
                data: {
                    message: hello
                }
            }
        })
        .build();
}
```

### About build() method

The `build()` method is crucial for route definition. It:
1. Finalizes the route configuration
2. Registers the route in the Fastify instance
3. Validates the route configuration
4. Applies all middleware and hooks
5. Sets up request/response schemas

**Important**: Every route definition must end with `.build()` to be registered.

## Route Configuration

### Controller and URL
```typescript
useRoute("feature")  // Sets controller name
    .get("/users")   // Sets URL path
    .code(200, Type.Object({  // Register success response
        users: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String()
        }))
    }))
    .code(404, Type.Object({  // Register error response
        error: Type.String()
    }))
    .build();
```

### Request Parameters with Validation
```typescript
useRoute("feature/:id")
    .get("/")
    .code(200, Type.Object({
        id: Type.String(),
        name: Type.String()
    }))
    .code(404, Type.Object({
        error: Type.String()
    }))
    .params(Type.Object({
        id: Type.String({
            pattern: "^[0-9a-fA-F]{24}$" // MongoDB ObjectId pattern
        })
    }))
    .build();
```

### Request Body with Validation
```typescript
useRoute("feature")
    .post("/")
    .code(201, Type.Object({
        id: Type.String(),
        name: Type.String()
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .body(Type.Object({
        name: Type.String(),
        age: Type.Number({
            minimum: 0,
            maximum: 120
        }),
        address: Type.Object({
            street: Type.String(),
            city: Type.String(),
            zip: Type.String({
                pattern: "^\\d{5}(-\\d{4})?$"
            })
        })
    }))
    .build();
```

## Guards

Guards are used to protect routes and can return either a boolean or a response object:

```typescript
useRoute("feature")
    .code(401, Type.Object({
        error: Type.String()
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .guard(async (req, res) => {
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

## File Uploads

```typescript
useRoute("feature")
    .acceptMultipart()
    .body(Type.Object({
        avatar: Type.String({ format: "binary" }),
        document: Type.String({ format: "binary" }),
        metadata: Type.Object({
            title: Type.String(),
            description: Type.String()
        })
    }))
    .fileOptions({
        maxFileSize: 1024 * 1024 * 5, // 5MB
        accept: ["image/jpeg", "image/png"]
    }, "avatar")
    .fileOptions({
        maxFileSize: 1024 * 1024 * 10, // 10MB
        accept: ["application/pdf", "application/msword"]
    }, "document")
    .code(200, Type.Object({
        urls: Type.Object({
            avatar: Type.String(),
            document: Type.String()
        })
    }))
    .build();
```

## Response Formats

The routing system supports various response formats:

### JSON Response (default)
```typescript
useRoute("feature")
    .get("/data")
    .json() // Optional, as JSON is default
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .handler(async (req, res) => {
        return {
            status: 200,
            data: { message: "Hello" }
        };
    })
    .build();
```

### Binary Response
```typescript
useRoute("feature")
    .get("/download")
    .binary()
    .handler(async (req, res) => {
        const fileBuffer = await getFileBuffer();
        return fileBuffer;
    })
    .build();
```

### Text Response
```typescript
useRoute("feature")
    .get("/text")
    .text()
    .handler(async (req, res) => {
        return "Hello, world!";
    })
    .build();
```

## Swagger Documentation

Enhance your API documentation in Swagger:

```typescript
useRoute("users")
    .post("/")
    .summary("Create new user")
    .description(`
        Creates a new user in the system.
        
        Required permissions:
        - user.create
        
        Rate limiting:
        - 10 requests per minute
    `)
    .tags(["Users", "Management"])
    .code(201, Type.Object({
        id: Type.String(),
        name: Type.String(),
        email: Type.String()
    }))
    .code(400, Type.Object({
        errors: Type.Array(Type.String())
    }))
    .body(Type.Object({
        name: Type.String(),
        email: Type.String(),
        password: Type.String()
    }))
    .handler(async (req, res) => {
        // Handler implementation
    })
    .build();
```

## Authentication

The routing system supports different authentication methods:

### Bearer Token Authentication
```typescript
useRoute("feature")
    .get("/protected")
    .auth("bearer", async (req, res) => {
        const isValid = await isBearerValid(req);
        if (!isValid) {
            return {
                status: 403,
                data: { error: "Invalid access token" }
            };
        }
        return true;
    })
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(403, Type.Object({
        error: Type.String()
    }))
    .build();
```

## Resolvers

Resolvers pre-process and validate data before it reaches the handler:

```typescript
useRoute("feature")
    .get("/:id")
    .code(200, Type.Object({
        data: Type.Any()
    }))
    .code(401, Type.Object({
        error: Type.String()
    }))
    .params(Type.Object({
        id: Type.String()
    }))
    .resolve<Session>(async (req) => {
        const sessionId = req.params.id;
        try {
            const session = await client.session.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                throw new Error("Session not found");
            }
            return session;
        } catch (e) {
            return {
                status: 401,
                data: { error: e.message }
            };
        }
    })
    .handler(async (req, res) => {
        const session = req.routeData;
        // Handler implementation
    })
    .build();
```

## Complete Example

Here's a complete CRUD example with full typing:

```typescript
export default function UserModule({useRoute}: AppContext): void {
    // Create user
    useRoute("users")
        .post("/")
        .summary("Create new user")
        .tags(["Users"])
        .code(201, Type.Object({
            id: Type.String(),
            name: Type.String(),
            email: Type.String()
        }))
        .code(400, Type.Object({
            errors: Type.Array(Type.String())
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .body(Type.Object({
            name: Type.String(),
            email: Type.String(),
            password: Type.String()
        }))
        .handler(async (req, res) => {
            const userService = Container.get(UserService);
            const user = await userService.create(req.body);
            return {
                status: 201,
                data: user
            };
        })
        .build();

    // Get user
    useRoute("users")
        .get("/:id")
        .summary("Get user by ID")
        .tags(["Users"])
        .code(200, Type.Object({
            id: Type.String(),
            name: Type.String(),
            email: Type.String()
        }))
        .code(404, Type.Object({
            error: Type.String()
        }))
        .params(Type.Object({
            id: Type.String()
        }))
        .handler(async (req, res) => {
            const userService = Container.get(UserService);
            const user = await userService.findById(req.params.id);
            if (!user) {
                return {
                    status: 404,
                    data: { error: "User not found" }
                };
            }
            return {
                status: 200,
                data: user
            };
        })
        .build();
} 