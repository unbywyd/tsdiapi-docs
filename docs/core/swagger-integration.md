# Swagger Integration

TSDIAPI provides automatic Swagger documentation generation with extensive customization options.

## 🚀 Automatic Setup

Swagger is automatically configured when you create your application:

```typescript
import { createApp } from "@tsdiapi/server";

createApp({
    // Your app configuration
});
```

The following is automatically configured:
- OpenAPI 3.0 specification
- Authentication schemes (Bearer, Basic, API Key)
- Route documentation
- Response schemas
- Request validation
- Swagger UI at `/docs` endpoint

## 🔧 Customization Options

### 1. Swagger Options

```typescript
import { createApp } from "@tsdiapi/server";
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';

createApp({
    swaggerOptions: {
        openapi: {
            info: {
                title: "My API",
                description: "Custom API Documentation",
                version: "1.0.0"
            },
            servers: [
                {
                    url: "http://localhost:3000",
                    description: "Development server"
                }
            ],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    }
                }
            }
        }
    }
});
```

### 2. Swagger UI Options

```typescript
import { createApp } from "@tsdiapi/server";
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

createApp({
    swaggerUiOptions: {
        routePrefix: '/api-docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true
        },
        staticCSP: true,
        transformSpecificationClone: true
    }
});
```

## 📝 Route Documentation

### 1. Basic Route Documentation

```typescript
useRoute("feature")
    .get("/example")
    .description("Get example data")
    .summary("Example endpoint")
    .tags(["Examples"])
    .build();
```

### 2. Request/Response Documentation

```typescript
useRoute("feature")
    .post("/create")
    .body(Type.Object({
        name: Type.String(),
        age: Type.Number()
    }))
    .code(200, Type.Object({
        id: Type.String(),
        name: Type.String()
    }))
    .code(400, Type.Object({
        error: Type.String()
    }))
    .build();
```

### 3. Authentication Documentation

```typescript
useRoute("feature")
    .get("/protected")
    .auth("bearer")
    .security([{ BearerAuth: [] }])
    .build();
```

## 🔐 Security Schemes

TSDIAPI automatically configures three security schemes:

1. **Bearer Authentication**:
   ```typescript
   components: {
       securitySchemes: {
           BearerAuth: {
               type: "http",
               scheme: "bearer",
               bearerFormat: "JWT"
           }
       }
   }
   ```

2. **Basic Authentication**:
   ```typescript
   components: {
       securitySchemes: {
           BasicAuth: {
               type: "http",
               scheme: "basic"
           }
       }
   }
   ```

3. **API Key Authentication**:
   ```typescript
   components: {
       securitySchemes: {
           ApiKeyAuth: {
               type: "apiKey",
               in: "header",
               name: "X-API-Key"
           }
       }
   }
   ```

## 🎨 UI Customization

### 1. Theme Configuration

```typescript
swaggerUiOptions: {
    theme: {
        css: [
            { filename: 'theme.css', content: '.swagger-ui .topbar { display: none }' }
        ]
    }
}
```

### 2. Layout Configuration

```typescript
swaggerUiOptions: {
    uiConfig: {
        docExpansion: 'none',
        deepLinking: false,
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true
    }
}
```

## 🔄 Environment-Based Configuration

```typescript
createApp({
    swaggerOptions: (defaultOptions) => ({
        ...defaultOptions,
        openapi: {
            ...defaultOptions.openapi,
            servers: process.env.NODE_ENV === 'production' 
                ? [{ url: 'https://api.example.com' }]
                : [{ url: 'http://localhost:3000' }]
        }
    })
});
```

## 📚 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Fastify Swagger Documentation](https://github.com/fastify/fastify-swagger)
- [Swagger UI Documentation](https://github.com/swagger-api/swagger-ui) 