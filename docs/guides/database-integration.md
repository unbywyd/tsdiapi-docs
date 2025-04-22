# Database Integration Guide

This guide explains how to integrate Prisma with your TSDIAPI project.

## 🚀 Quick Start

1. **Add Prisma Plugin**:
   ```bash
   tsdiapi plugins add prisma
   ```
   This command will automatically:
   - Install Prisma and its dependencies
   - Set up database connection
   - Configure the necessary files

2. **Run Initial Migration**:
   ```bash
   prisma migrate dev
   ```

## 🔄 Database Migrations

After any changes to the Prisma schema:
```bash
prisma migrate dev
```

## 📦 TypeBox Schema Generation

Prisma models are automatically converted to TypeBox schemas. These schemas are generated in the `@base/api/typebox-schemas/models/` directory and can be used in your routing definitions.

### Example Usage in Routing
```typescript
import { OutputTsdiapiSchema } from "@base/api/typebox-schemas/models/OutputTsdiapiSchema.model.js";

export default function FeatureModule({ useRoute }: AppContext): void {
    useRoute("feature")
        .get("/text")
        .code(200, OutputTsdiapiSchema)
        .handler(async () => {
            // Your handler logic here
        })
        .build();
}
```

## 🛠 PrismaQL for Schema Management

PrismaQL provides a safe way to modify your Prisma schema. It automatically creates backups and handles migrations safely. For a complete reference of available commands, see the [PrismaQL Documentation](../guides/prismaql.md).

### Basic Commands
```bash
# Add a new model
prismaql "ADD MODEL User ({ name String });"

# Add a field
prismaql "ADD FIELD email TO User ({String});"

# View models
prismaql "GET MODELS"
```

## 🔌 Plugin Integration

### Basic Setup
```typescript
import { createApp } from "@tsdiapi/server";
import PrismaPlugin from "@tsdiapi/prisma";

createApp({
  plugins: [PrismaPlugin()]
});
```

## ⚙️ Service Usage Example

### 1. Define Service with Prisma
```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";

@Service()
export default class UserService {
    async getUsers() {
        const prisma = usePrisma<PrismaClient>();
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true
            }
        });
    }
}
```

### 2. Use Service in Route
```typescript
import { UserService } from "./user.service.js";
import { UserSchema } from "@base/api/typebox-schemas/models/UserSchema.model.js";

export default function UserModule({ useRoute }: AppContext): void {
    useRoute("users")
        .get("/")
        .code(200, Type.Array(UserSchema))
        .handler(async (req, res) => {
            const service = Container.get(UserService);
            const users = await service.getUsers();
            return {
                status: 200,
                data: users
            };
        })
        .build();
}
```

## ⚠️ Important Notes

1. **Prisma Client Access**:
   - Use `usePrisma()` only within route handlers or services
   - Available after server initialization
   - For global access, use `fastify.prisma` (requires type assertion)

2. **Type Safety**:
   ```typescript
   // In route handlers or services
   const prisma = usePrisma<PrismaClient>();
   
   // Global access
   const prisma = fastify.prisma as PrismaClient;
   ```

3. **TypeBox Schemas Location**:
   - Schemas are generated in `@base/api/typebox-schemas/models/`
   - Import path format: `@base/api/typebox-schemas/models/YourSchema.model.js`

## 🔄 Workflow

1. Add/update Prisma schema using PrismaQL
2. Run migrations: `prisma migrate dev`
3. Use generated TypeBox schemas from `@base/api/typebox-schemas/models/` in routes
4. Access Prisma client in route handlers or services using `usePrisma<PrismaClient>()`

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Prisma Schema Generator UI](https://prisma-dto-generator.netlify.app/) 