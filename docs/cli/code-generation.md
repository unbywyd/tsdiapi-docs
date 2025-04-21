# Code Generation Guide

TSDIAPI provides a powerful code generation system that allows plugins to register their own generators. This guide explains how to use and create code generators.

## 🚀 Using Plugin Generators

### Basic Usage
```bash
# Navigate to your API directory
cd src/api

# Generate code using a plugin's generator
tsdiapi generate <pluginName> <generatorName>
```

### Example Usage
```bash
# Generate code using any plugin's generator
tsdiapi generate <pluginName> <generatorName>
```

This will:
1. Show available generators in the plugin
2. Prompt for required parameters
3. Generate the necessary files
4. Update Prisma schema if needed
5. Add new endpoints to Swagger

## 🔧 Generator Configuration

Plugins can register generators with the following configuration:

```typescript
{
    "name": "feature",                    // Generator name
    "description": "Generate a feature",  // Generator description
    "dependencies": [                     // Required dependencies
        "@tsdiapi/inforu",
        "@tsdiapi/email"
    ],
    "files": [                           // Files to generate
        {
            "source": "generators/feature/*.*",
            "destination": "{{name}}",
            "overwrite": false,
            "isHandlebarsTemplate": true
        }
    ],
    "args": [                            // Generator arguments
        {
            "name": "userModelName",
            "description": "Prisma model name for users",
            "inquirer": {
                "type": "input",
                "message": "Enter the Prisma model name for users:",
                "default": "User"
            }
        }
    ],
    "prismaScripts": [                   // Prisma schema updates
        {
            "command": "ADD MODEL {{pascalCase userModelName}} ({id String @id @default(cuid())});",
            "description": "Add User model to Prisma schema"
        }
    ],
    "postMessages": [                    // Success messages
        "✅ Feature {{name}} created successfully!"
    ]
}
```

## 📦 Plugin Generators

### Overview
Each plugin can register its own generators. These generators can:
- Create new features
- Generate services
- Set up modules
- Update Prisma schema
- Add Swagger documentation

### Discovering Generators
```bash
# List available generators in a plugin
tsdiapi generate <pluginName> --list
```

### Common Generator Types
1. **Feature Generators**
   - Create complete feature modules
   - Set up controllers, services, and schemas
   - Configure routes and endpoints

2. **Service Generators**
   - Generate service classes
   - Set up dependency injection
   - Create base functionality

3. **Schema Generators**
   - Create TypeBox schemas
   - Generate validation rules
   - Set up Swagger documentation

4. **Database Generators**
   - Update Prisma schema
   - Create database models
   - Set up migrations

## 🔄 Generator Workflow

1. **Selection**:
   - Choose the generator from available options
   - Plugin may offer multiple generators

2. **Configuration**:
   - Enter required parameters
   - Set default values
   - Configure model names

3. **Generation**:
   - Create new files
   - Update existing files
   - Modify Prisma schema

4. **Post-Generation**:
   - Show success messages
   - Display next steps
   - Update Swagger documentation

## 📝 Example Generation Process

1. **Start Generation**:
   ```bash
   cd src/api
   tsdiapi generate <pluginName> <generatorName>
   ```

2. **Select Generator**:
   ```
   ? Select generator:
   ❯ generator1
     generator2
     generator3
   ```

3. **Configure Parameters**:
   ```
   ? Enter required parameter: value
   ? Choose option: option1
   ```

4. **Generated Files**:
   ```
   src/api/feature/
   ├── feature.controller.ts
   ├── feature.service.ts
   ├── feature.module.ts
   └── feature.schema.ts
   ```

## 🔒 Best Practices

1. **Naming Conventions**:
   - Use kebab-case for generator names
   - Follow consistent file naming
   - Use descriptive parameter names

2. **File Organization**:
   - Keep generator templates organized
   - Use clear directory structure
   - Document template variables

3. **Error Handling**:
   - Validate inputs
   - Provide clear error messages
   - Handle file conflicts

4. **Documentation**:
   - Document generator purpose
   - Explain required parameters
   - Provide usage examples

## 📚 Additional Resources

- [Plugin Development Guide](https://github.com/tsdiapi/tsdiapi-cli)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
