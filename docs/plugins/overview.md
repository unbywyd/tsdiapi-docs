# Plugins Overview

TSDIAPI provides a powerful plugin system that allows you to extend the functionality of your application. This guide explains how to create, use, and manage plugins.

## 🚀 Basic Plugin Structure

A basic plugin follows this structure:

```typescript
import type { AppContext, AppPlugin } from "@tsdiapi/server";

// Plugin configuration type
export type PluginOptions = {
    // Add your plugin options here
}

// Default configuration
const defaultConfig: PluginOptions = {
    // Default values for your options
}

// Plugin implementation
class App implements AppPlugin {
    name = 'tsdiapi-testplug';
    config: PluginOptions;
    context: AppContext;
    services: AppPlugin['services'] = [];
    
    constructor(config?: PluginOptions) {
        this.config = { ...defaultConfig, ...config };
    }
    
    async onInit(ctx: AppContext) {
        this.context = ctx;
        console.log('Hello, I am testplug plugin.');
    }
}

// Plugin factory function
export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}
```

## 🔌 Using Plugins

### Installation
```bash
# Install a plugin
npm install @tsdiapi/<plugin-name>
```

### Registration
```typescript
import { createApp } from "@tsdiapi/server";
import createPlugin from "@tsdiapi/<plugin-name>";

createApp({
    plugins: [
        createPlugin({
            // Plugin configuration
        })
    ]
});
```

## 🔧 Plugin Components

### 1. Configuration
- Define plugin options using TypeScript interfaces
- Provide default values
- Validate configuration in constructor

### 2. Services
- Register services that can be injected
- Services are available throughout the application
- Use dependency injection for service access

### 3. Lifecycle Hooks

| Hook | Description | Usage |
|------|-------------|-------|
| `onInit` | Called when the plugin is initialized | Setup services, register routes |
| `beforeStart` | Called before the server starts | Final configuration, validation |
| `preReady` | Called before the server is ready | Setup middleware, prepare services |
| `afterStart` | Called after the server starts | Start background tasks, logging |

Example:
```typescript
class App implements AppPlugin {
    async onInit(ctx: AppContext) {
        // Initialize plugin
    }
    
    async beforeStart(ctx: AppContext) {
        // Prepare for server start
    }
    
    async preReady(ctx: AppContext) {
        // Setup before server is ready
    }
    
    async afterStart(ctx: AppContext) {
        // Start background tasks
    }
}
```

## 📦 Plugin Features

### 1. Service Registration
```typescript
class App implements AppPlugin {
    services = [
        MyService,
        AnotherService
    ];
}
```

### 2. Route Registration
```typescript
async onInit(ctx: AppContext) {
    ctx.useRoute()
        .get("/plugin-endpoint")
        .handler(async (req) => {
            return { message: "Hello from plugin!" };
        })
        .build();
}
```

### 3. Configuration Access
```typescript
async onInit(ctx: AppContext) {
    const port = ctx.projectConfig.get("PORT", 3000);
    const host = ctx.projectConfig.get("HOST", "localhost");
}
```

## 🔍 AppContext

The `AppContext` provides access to:

```typescript
interface AppContext {
    fastify: FastifyInstance;          // Fastify server instance
    environment: 'production' | 'development';
    appDir: string;                    // Application directory
    options: AppOptions;               // Application options
    fileLoader?: FileLoader;           // File loader function
    projectConfig: AppConfig;          // Project configuration
    projectPackage: Record<string, any>; // Package.json contents
    plugins?: Record<string, AppPlugin>; // Loaded plugins
    useRoute: RouteBuilder;            // Route builder function
}
```

## 📚 Best Practices

1. **Configuration**
   - Use TypeScript for type safety
   - Provide sensible defaults
   - Document configuration options

2. **Error Handling**
   - Validate configuration
   - Handle initialization errors
   - Provide clear error messages

3. **Dependencies**
   - Keep dependencies minimal
   - Use peer dependencies when appropriate
   - Document required dependencies

4. **Documentation**
   - Document plugin purpose
   - Provide usage examples
   - Include configuration options

## 🔗 Additional Resources

- [Plugin Development Guide](./development.md)
- [Service Injection Guide](../core/services.md)
- [Route Building Guide](../core/routing.md)
