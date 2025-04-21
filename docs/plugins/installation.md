# Plugin Installation Guide

This guide explains how to install and configure TSDIAPI plugins in your application using both automatic and manual methods.

## 📦 Installation Methods

### 1. Automatic Installation (Recommended)

Use the TSDIAPI CLI to automatically install and configure plugins:

```bash
# Install a plugin using TSDIAPI CLI
tsdiapi plugins add @tsdiapi/<plugin-name>

# Example: Install JWT Auth plugin
tsdiapi plugins add @tsdiapi/jwt-auth
```

The CLI will:
- Install the plugin package
- Add necessary configuration
- Update your project settings

### 2. Manual Installation

If you prefer manual installation, follow these steps:

1. Install the plugin package:
   ```bash
   npm install @tsdiapi/<plugin-name>
   ```

2. Configure the plugin using TSDIAPI config:
   ```bash
   tsdiapi config @tsdiapi/<plugin-name>
   ```

3. Register the plugin in your application's entry point (`src/index.ts`):
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

## ⚙️ Configuration Examples

### JWT Auth Plugin Configuration

```typescript
createJwtAuthPlugin({
    // JWT secret key
    secret: process.env.JWT_SECRET,
    
    // Token expiration time
    expiresIn: '24h',
    
    // Additional options
    options: {
        // JWT options
    }
})
```

## 🔍 Example Usage

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
## 📝 Next Steps

1. Read the plugin's documentation for advanced features
2. Configure plugin options according to your needs
3. Integrate the plugin with your application
4. Test the plugin functionality
5. Monitor for any issues in production

## 🔗 Additional Resources

- [Plugin Overview](../plugins/overview.md)
- [Plugin Development Guide](../plugins/development.md)
- [Official Plugin Documentation](https://tsdiapi.dev/plugins)
