# CLI Commands

This guide covers all available commands in the TSDIAPI CLI.

## 🚀 Project Management

### Create New Project
```bash
# Interactive setup
tsdiapi init [name]

# Alias for init
tsdiapi create <name>

# Quick start with defaults
tsdiapi start <name>
```

## 🔌 Plugin Management

### Install Plugins
```bash
# Add a plugin
tsdiapi plugins add <pluginName>

# Alias for plugins add
tsdiapi add <pluginName>
```

### Configure Plugins
```bash
# Configure a plugin
tsdiapi plugins config <pluginName>

# Alias for plugins config
tsdiapi config <pluginName>
```

### Update Plugins
```bash
# Update a plugin
tsdiapi plugins update <pluginName>
```

## ⚙️ Code Generation

### Generate Resources
```bash
# Generate using a plugin or built-in generator
tsdiapi generate <pluginArg> <name>

# Generate a new feature module
tsdiapi feature <name>

# Generate a new service
tsdiapi service <name> [feature]

# Generate a new module
tsdiapi module <name> [feature]
```

### Prisma Integration
```bash
# Add PrismaORM to the project
tsdiapi prisma
```

## 🛠 Developer Tools

### Plugin Development
```bash
# Create a new plugin
tsdiapi dev plugin <name>

# Validate plugin configuration
tsdiapi dev check
```

## 📋 Command Reference

### Project Commands
| Command | Description |
|---------|-------------|
| `tsdiapi init [name]` | Initializes a new TSDIAPI project with interactive setup |
| `tsdiapi create <name>` | Alias for init, creates a new project |
| `tsdiapi start <name>` | Quickly creates a project with default settings and starts the server |

### Plugin Commands
| Command | Description |
|---------|-------------|
| `tsdiapi plugins add <pluginName>` | Adds a plugin to the project |
| `tsdiapi add <pluginName>` | Alias for plugins add |
| `tsdiapi plugins config <pluginName>` | Configures an installed plugin |
| `tsdiapi config <pluginName>` | Alias for plugins config |
| `tsdiapi plugins update <pluginName>` | Updates an installed plugin |

### Generation Commands
| Command | Description |
|---------|-------------|
| `tsdiapi generate <pluginArg> <name>` | Generates files using a plugin or built-in generator |
| `tsdiapi feature <name>` | Generates a new feature module |
| `tsdiapi service <name> [feature]` | Generates a new service with optional feature module |
| `tsdiapi module <name> [feature]` | Generates a new module with optional feature module |
| `tsdiapi prisma` | Adds PrismaORM to the project |

### Developer Commands
| Command | Description |
|---------|-------------|
| `tsdiapi dev plugin <name>` | Creates a new plugin with interactive setup |
| `tsdiapi dev check` | Validates the configuration of a plugin |

## 🔄 Quick Start Example

1. Create a new project:
   ```bash
   tsdiapi create myapi
   cd myapi
   ```

2. Add required plugins:
   ```bash
   tsdiapi plugins add prisma
   tsdiapi plugins add jwt-auth
   ```

3. Generate resources:
   ```bash
   tsdiapi feature user
   tsdiapi service auth
   ```

4. Start development:
   ```bash
   npm start
   ```

## 📚 Additional Resources

- [Plugin Development Guide](https://github.com/tsdiapi/tsdiapi-cli)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
