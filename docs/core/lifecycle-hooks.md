# Lifecycle Hooks

TSDIAPI provides several lifecycle hooks that allow you to execute code at specific points during your application's lifecycle.

## Available Hooks

### onInit
Called when the application is initialized, before any other hooks. This is the ideal place for:
- Setting up initial configurations
- Registering services
- Initializing external connections

```typescript
createApp<ConfigType>({
    onInit: async (ctx) => {
        // Access configuration
        const port = ctx.projectConfig.get('PORT', 3000);
        const host = ctx.projectConfig.get('HOST', 'localhost');
        
        // Initialize services
        await initializeServices();
        
        console.log('Application initialized');
    }
});
```

### beforeStart
Executed before the server starts listening for requests. Use this hook for:
- Final configuration checks
- Database migrations
- Resource validation

```typescript
createApp<ConfigType>({
    beforeStart: async (ctx) => {
        // Verify database connection
        await checkDatabaseConnection();
        
        // Run migrations
        await runMigrations();
        
        console.log('Pre-start checks completed');
    }
});
```

### preReady
Runs before the server is marked as ready. Perfect for:
- Loading initial data
- Warming up caches
- Setting up background tasks

```typescript
createApp<ConfigType>({
    preReady: async (ctx) => {
        // Load cache
        await warmupCache();
        
        // Initialize background workers
        await startBackgroundWorkers();
        
        console.log('Server preparing to be ready');
    }
});
```

### afterStart
Triggered after the server has started and is ready to accept requests. Use this for:
- Starting background jobs
- Logging server status
- Sending notifications

```typescript
createApp<ConfigType>({
    afterStart: async (ctx) => {
        const address = ctx.fastify.server.address();
        console.log(`Server started on ${address}`);
        
        // Start scheduled tasks
        startScheduledJobs();
    }
});
```

## Using Hooks in Plugins

Plugins can also implement lifecycle hooks. This allows you to modularize your application's initialization logic:

```typescript
const MyPlugin: AppPlugin = {
    name: 'my-plugin',
    
    onInit: async (ctx) => {
        // Plugin initialization
        console.log('Initializing my plugin');
    },
    
    beforeStart: async (ctx) => {
        // Pre-start setup
        await setupPluginResources();
    },
    
    preReady: async (ctx) => {
        // Prepare plugin
        await warmupPluginCache();
    },
    
    afterStart: async (ctx) => {
        // Plugin is ready
        console.log('Plugin started successfully');
    }
};
```

## Hook Context

All hooks receive an `AppContext` object that provides access to:

```typescript
interface AppContext<T> {
    // Fastify instance
    fastify: FastifyInstance;
    
    // Current environment
    environment: 'production' | 'development';
    
    // Application directory
    appDir: string;
    
    // Application options
    options: AppOptions<T>;
    
    // File handling
    fileLoader?: FileLoader;
    
    // Configuration
    projectConfig: AppConfig<T>;
    
    // Package.json contents
    projectPackage: Record<string, any>;
    
    // Loaded plugins
    plugins?: Record<string, AppPlugin>;
    
    // Route builder
    useRoute: RouteBuilder;
}
```

## Best Practices

1. **Asynchronous Operations**
   - All hooks support async/await
   - Handle errors properly in async operations
   - Use try/catch blocks for critical operations

```typescript
createApp<ConfigType>({
    onInit: async (ctx) => {
        try {
            await initializeCriticalServices();
        } catch (error) {
            console.error('Failed to initialize:', error);
            process.exit(1);
        }
    }
});
```

2. **Order of Operations**
   - Use appropriate hooks for different tasks
   - Don't perform heavy operations in afterStart
   - Keep initialization logic in onInit

3. **Error Handling**
   - Handle errors appropriately in each hook
   - Log errors with proper context
   - Consider the impact of hook failures

```typescript
createApp<ConfigType>({
    beforeStart: async (ctx) => {
        try {
            await validateResources();
        } catch (error) {
            ctx.fastify.log.error('Resource validation failed:', error);
            throw error; // Stop server startup if critical
        }
    }
});
```

4. **Configuration Access**
   - Use projectConfig for accessing configuration
   - Validate configuration values early
   - Set appropriate defaults

```typescript
createApp<ConfigType>({
    onInit: async (ctx) => {
        const dbUrl = ctx.projectConfig.get('DATABASE_URL');
        if (!dbUrl) {
            throw new Error('DATABASE_URL is required');
        }
    }
});
```

## Hook Execution Order

1. `onInit` - Application initialization
2. `beforeStart` - Pre-server start checks
3. `preReady` - Final preparations
4. `afterStart` - Post-server start tasks

Each hook must complete successfully before the next one is executed. If any hook throws an error, the application startup will fail. 