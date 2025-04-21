# TSDIAPI CLI

A powerful and flexible command-line interface (CLI) for managing TSDIAPI projects.  
TSDIAPI is a modern, ESM-based framework built with TypeScript and Fastify, focusing on high performance, modularity, and flexibility. The CLI enables developers to rapidly build APIs with a well-structured, feature-based architecture.

## What is TSDIAPI?

TSDIAPI combines several powerful technologies to create a robust API development framework:

- **TypeScript-First**: Built from the ground up with TypeScript for complete type safety
- **Fastify-Powered**: High-performance server with an intuitive routing system
- **ESM Native**: Modern JavaScript module system for better code organization
- **Dependency Injection**: Built-in DI system using TypeDI
- **Type Validation**: Runtime type validation using TypeBox

## Key Features

- ✅ **Quick Project Setup**: Initialize new projects with a single command
- ✅ **Modern Architecture**: ESM modules and TypeScript for better code organization
- ✅ **Type Safety**: Complete TypeScript support with runtime type validation
- ✅ **High Performance**: Fastify-based server for optimal speed
- ✅ **Code Generation**: CLI tools for generating features, services, and modules
- ✅ **Environment Management**: Built-in configuration system for different environments
- ✅ **Developer Experience**: Hot reload, debugging support, and detailed error messages

## Framework Structure

TSDIAPI projects follow a clear, feature-based structure:

```
my-api/
├── src/
│   ├── api/
│   │   └── features/      # Feature modules
│   │       └── users/
│   │           ├── users.module.ts
│   │           └── users.service.ts
│   ├── app.config.ts     # Application configuration
│   └── main.ts          # Application entry point
├── .env                 # Environment variables
├── .env.development
├── .env.production
├── bin.js              # Application startup
├── loader.mjs          # ES module loader
├── nodemon.json        # Development server config
├── package.json
├── tsconfig.json
└── README.md
```

## Core Concepts

### Feature Module Example (users.module.ts)
```typescript
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { Container } from "typedi";
import { UsersService } from "./users.service.js";

// Define response schemas
const UserSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

const ErrorSchema = Type.Object({
    error: Type.String()
});

export default function UsersModule({ useRoute }: AppContext): void {
    // Create user endpoint
    useRoute("users")
        .post("/")
        .summary("Create new user")
        .description("Creates a new user in the system")
        .tags(["Users"])
        .body(Type.Object({
            name: Type.String(),
            email: Type.String(),
            password: Type.String()
        }))
        .code(201, UserSchema)
        .code(400, ErrorSchema)
        .handler(async (req) => {
            const userService = Container.get(UsersService);
            const user = await userService.create(req.body);
            return {
                status: 201,
                data: user
            };
        })
        .build();

    // Get user endpoint
    useRoute("users")
        .get("/:id")
        .summary("Get user by ID")
        .description("Retrieves user information by ID")
        .tags(["Users"])
        .params(Type.Object({
            id: Type.String()
        }))
        .code(200, UserSchema)
        .code(404, ErrorSchema)
        .handler(async (req) => {
            const userService = Container.get(UsersService);
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
```

### Service Example (users.service.ts)
```typescript
import { Service } from "typedi";

interface User {
    id: string;
    name: string;
    email: string;
    password: string;
}

@Service()
export class UsersService {
    private users: User[] = [];

    async create(userData: Omit<User, "id">): Promise<Omit<User, "password">> {
        const user = {
            id: crypto.randomUUID(),
            ...userData
        };
        this.users.push(user);
        
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async findById(id: string): Promise<Omit<User, "password"> | null> {
        const user = this.users.find(u => u.id === id);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
```

### Configuration (app.config.ts)
```typescript
import { Type } from "@sinclair/typebox";

export const ConfigSchema = Type.Object({
    PORT: Type.Number({
        default: 3000,
        minimum: 1,
        maximum: 65535
    }),
    HOST: Type.String({
        default: "localhost"
    })
});

export type ConfigType = Static<typeof ConfigSchema>;
```

### Application Entry (main.ts)
```typescript
import { createApp } from "@tsdiapi/server";
import { ConfigType, ConfigSchema } from "./app.config.js";

async function bootstrap() {
    const app = await createApp<ConfigType>({
        configSchema: ConfigSchema
    });

    console.log(`Server running at http://${app.config.HOST}:${app.config.PORT}`);
}

bootstrap().catch(console.error);
```

## Getting Started

Ready to build your first API? Check out our [Installation Guide](installation) to set up TSDIAPI! 