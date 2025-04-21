# Plugin Configuration Guide

This guide explains how to configure TSDIAPI plugins in your application.

## 🚀 Automatic Configuration

When you install a plugin using the CLI, it automatically:

1. Adds the plugin to your `main.ts`:
   ```typescript
   import { createApp } from "@tsdiapi/server";
   import createPlugin from "@tsdiapi/plugin-name";

   createApp({
       plugins: [
           createPlugin({
               // Plugin configuration
           })
       ]
   });
   ```

2. Extends your `app.config.ts` with TypeBox schema for environment variables:
   ```typescript
   import { Type } from "@sinclair/typebox";

   export const ConfigSchema = Type.Object({
       // Default variables
       PORT: Type.Number(),
       HOST: Type.String(),
       
       // Plugin variables
       PLUGIN_API_KEY: Type.String(),
       PLUGIN_TIMEOUT: Type.Number()
   });
   ```

3. Updates your `.env` file with required variables:
   ```env
   PLUGIN_API_KEY=your-key
   PLUGIN_TIMEOUT=60
   ```

## ⚙️ Manual Configuration

If you need to reconfigure a plugin or if the automatic configuration was interrupted, use:

```bash
tsdiapi config @tsdiapi/plugin-name
```

This will:
- Prompt for all required configuration values
- Update your `.env` file
- Update your `app.config.ts` TypeBox schema if needed

## 🔧 Configuration Options

Plugins can be configured in three ways:

1. **Environment Variables** (Recommended)
   ```env
   PLUGIN_API_KEY=your-key
   PLUGIN_TIMEOUT=60
   ```

2. **Direct Configuration in main.ts**
   ```typescript
   createPlugin({
       apiKey: "your-key",
       timeout: 60
   })
   ```

3. **TypeBox Schema in app.config.ts**
   ```typescript
   import { Type } from "@sinclair/typebox";

   export const ConfigSchema = Type.Object({
       PLUGIN_API_KEY: Type.String(),
       PLUGIN_TIMEOUT: Type.Number()
   });
   ```

## 📝 Configuration Priority

Configuration values are loaded in this order:
1. Direct configuration in `main.ts`
2. Environment variables from `.env` (validated against TypeBox schema in `app.config.ts`)
3. Default values from the plugin

## 🔍 Verifying Configuration

To verify your plugin configuration:

1. Check `main.ts` for plugin registration
2. Check `.env` for required variables
3. Check `app.config.ts` for TypeBox schema definitions
4. Run the application to ensure proper initialization

## 🚨 Common Issues

### Missing Configuration
If a plugin reports missing configuration:
```bash
tsdiapi config @tsdiapi/plugin-name
```

### Type Errors
If you get type errors:
1. Check `app.config.ts` for correct TypeBox schema definitions
2. Ensure all required variables are defined in `.env`
3. Run `tsdiapi config` to update configuration

### Environment Variables
If environment variables aren't loading:
1. Check `.env` file exists
2. Verify variable names match TypeBox schema in `app.config.ts`
3. Restart the application

## 📚 Additional Resources

- [Plugin Installation Guide](./installation.md)
- [Plugin Development Guide](./development.md)
- [Official Plugin Documentation](https://tsdiapi.dev/plugins)
