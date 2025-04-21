# Quick Start

This guide will help you create and run your first TSDIAPI project. For detailed installation instructions, see the [Installation Guide](installation).

## Creating Your First API

### 1. Create a New Project

```bash
npx @tsdiapi/cli create my-api
cd my-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Your First Feature

Create a new file `src/api/features/hello/hello.module.ts`:

```typescript
import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

const MessageSchema = Type.Object({
    message: Type.String()
});

export default function HelloModule({ useRoute }: AppContext): void {
    useRoute("hello")
        .get("/")
        .summary("Get hello message")
        .description("Returns a friendly greeting")
        .tags(["Hello"])
        .code(200, MessageSchema)
        .handler(async () => {
            return {
                status: 200,
                data: { message: "Hello from TSDIAPI!" }
            };
        })
        .build();
}
```

### 4. Configure Your Application

Create or update `src/app.config.ts`:

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

### 5. Set Up the Entry Point

Update `src/main.ts`:

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

### 6. Start the Development Server

```bash
npm run dev
```

Your API will be available at `http://localhost:3000/docs`.

## Development Features

When running in development mode (`npm run dev`), you get:

- ✅ **Hot Reloading**: Changes are automatically detected
- ✅ **Detailed Logging**: See what's happening in your app
- ✅ **TypeScript Compilation**: Automatic transpilation
- ✅ **Error Reporting**: Detailed error messages

## Next Steps

Now that you have your first API running:

1. Learn about the [Project Structure](project-structure)
2. Explore [Routing](../core/routing)
3. Understand [Dependency Injection](../core/dependency-injection) 