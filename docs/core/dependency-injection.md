# Dependency Injection

TSDIAPI uses TypeDI for dependency injection, providing a powerful and type-safe way to manage dependencies in your application.

## Service Registration

Services are registered using decorators:

```typescript
import { Service } from 'typedi';

@Service()
class UserService {
    async findById(id: string) {
        // Implementation
    }
}
```

## Service Injection

Services can be injected into other services or route handlers:

```typescript
import { Service } from 'typedi';
import { Container } from 'typedi';

@Service()
class AuthService {
    constructor(private userService: UserService) {}
    
    async authenticate(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        // Authentication logic
    }
}

// In a route handler
useRoute()
    .post('/login')
    .handler(async (req) => {
        const authService = Container.get(AuthService);
        const result = await authService.authenticate(
            req.body.email,
            req.body.password
        );
        return result;
    });
```

## Scoped Services

You can create scoped services that are instantiated per request:

```typescript
import { Service, Scope } from 'typedi';

@Service({ scope: Scope.Request })
class RequestContext {
    constructor(public requestId: string) {}
}
```

## Service Lifecycle

Services can implement lifecycle hooks:

```typescript
import { Service, OnDestroy } from 'typedi';

@Service()
class DatabaseService implements OnDestroy {
    async onDestroy() {
        // Cleanup database connections
    }
}
```

## Best Practices

1. Use constructor injection for required dependencies
2. Keep services focused and single-responsibility
3. Use interfaces for better testability
4. Document service dependencies
5. Use scoped services for request-specific data 