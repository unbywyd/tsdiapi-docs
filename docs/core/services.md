# Services

Services in TSDIAPI handle business logic and are managed through TypeDI dependency injection. They keep your modules clean and your code organized.

## Service Basics

A typical service using Prisma looks like this:

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";

@Service()
export class FeatureService {
    async getHello(): Promise<string> {
        const prisma = usePrisma<PrismaClient>();
        const count = await prisma.tsdiapi.count();
        return "Hello World";
    }
}
```

## Dependency Injection

Services use TypeDI for dependency injection, and Prisma client is accessed through the `usePrisma` hook:

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";
import { EmailService } from "./email.service.js";

@Service()
export class UserService {
    constructor(
        private emailService: EmailService
    ) {}

    async createUser(data: any) {
        const prisma = usePrisma<PrismaClient>();
        const user = await prisma.user.create({
            data
        });
        await this.emailService.sendWelcomeEmail(user.email);
        return user;
    }
}
```

## Important Notes

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

## Service Organization

### Single Responsibility

Each service should have a single responsibility and use Prisma for data access:

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";

@Service()
export class AuthenticationService {
    constructor(
        private tokenService: TokenService
    ) {}

    async login(credentials: any) {
        const prisma = usePrisma<PrismaClient>();
        const user = await prisma.user.findUnique({
            where: { email: credentials.email }
        });
        if (!user) {
            throw new Error("Invalid credentials");
        }
        return this.tokenService.generateToken(user);
    }
}
```

### Service Layers

Organize services in layers with Prisma integration:

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";

@Service()
export class UserRepository {
    async findById(id: string) {
        const prisma = usePrisma<PrismaClient>();
        return prisma.user.findUnique({
            where: { id }
        });
    }
}

@Service()
export class UserService {
    constructor(private repo: UserRepository) {}
    
    async getUser(id: string) {
        const user = await this.repo.findById(id);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
}
```

## Error Handling

Implement proper error handling in services with Prisma:

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";

@Service()
export class UserService {
    async getUser(id: string) {
        const prisma = usePrisma<PrismaClient>();
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    async createUser(data: any) {
        const prisma = usePrisma<PrismaClient>();
        try {
            return await prisma.user.create({
                data
            });
        } catch (error) {
            if (error.code === "P2002") {
                throw new Error("Email already exists");
            }
            throw error;
        }
    }
}
```

## Best Practices

1. **Prisma Integration**
   - Use `usePrisma<PrismaClient>()` for type-safe database access
   - Handle Prisma-specific errors appropriately
   - Access Prisma client only within services or route handlers

2. **Dependency Injection**
   - Use `@Service()` decorator
   - Inject dependencies through constructor
   - Keep services loosely coupled

3. **Business Logic**
   - Keep business logic in services
   - Services should be independent
   - Use proper abstraction layers

4. **Error Handling**
   - Use custom error classes
   - Handle specific Prisma error codes
   - Provide meaningful error messages

## Complete Example

Here's a complete example of a well-structured service with Prisma:

```typescript
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";
import { EmailService } from "./email.service.js";
import { UserNotFoundError, DuplicateEmailError } from "./errors.js";

@Service()
export class UserService {
    constructor(
        private emailService: EmailService
    ) {}

    async getAllUsers() {
        const prisma = usePrisma<PrismaClient>();
        return prisma.user.findMany();
    }

    async getUser(id: string) {
        const prisma = usePrisma<PrismaClient>();
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new UserNotFoundError(id);
        }

        return user;
    }

    async createUser(data: any) {
        const prisma = usePrisma<PrismaClient>();
        try {
            const user = await prisma.user.create({
                data
            });

            await this.emailService.sendWelcomeEmail(user.email);

            return user;
        } catch (error) {
            if (error.code === "P2002") {
                throw new DuplicateEmailError(data.email);
            }
            throw error;
        }
    }

    async updateUser(id: string, data: any) {
        const prisma = usePrisma<PrismaClient>();
        try {
            return await prisma.user.update({
                where: { id },
                data
            });
        } catch (error) {
            if (error.code === "P2025") {
                throw new UserNotFoundError(id);
            }
            throw error;
        }
    }

    async deleteUser(id: string) {
        const prisma = usePrisma<PrismaClient>();
        try {
            await prisma.user.delete({
                where: { id }
            });
        } catch (error) {
            if (error.code === "P2025") {
                throw new UserNotFoundError(id);
            }
            throw error;
        }
    }
} 