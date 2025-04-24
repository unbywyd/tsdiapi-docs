# Error Handling Guide

This guide covers different approaches to error handling in TSDIAPI applications.

## 🚀 Basic Approaches

### 1. Manual Response Codes Registration

The most basic approach where you manually register response codes and schemas for each route:

```typescript
import { Type } from '@sinclair/typebox';

const ContactSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

const ErrorSchema = Type.Object({
    error: Type.String(),
    details: Type.Optional(Type.String())
});

useRoute("contacts")
    .get("/")
    .version('1')
    .code(200, Type.Array(ContactSchema))
    .code(400, ErrorSchema)
    .code(401, ErrorSchema)
    .code(403, ErrorSchema)
    .code(404, ErrorSchema)
    .code(500, ErrorSchema)
    .handler(async (req) => {
        try {
            const contacts = await contactService.findAll();
            return response200(contacts);
        } catch (error) {
            return error; // Service methods throw errors with proper status and message
        }
    })
    .build();
```

### 2. Using buildResponseCodes and Response Functions

A more convenient way to register standard response codes:

```typescript
import { buildResponseCodes, Type, response200, response500 } from '@tsdiapi/server';

const ContactSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

const ErrorSchema = Type.Object({
    error: Type.String(),
    details: Type.Optional(Type.String())
});

// Register all standard response codes at once
useRoute("contacts")
    .get("/")
    .version('1')
    .codes(buildResponseCodes(Type.Array(ContactSchema), ErrorSchema))
    .handler(async (req) => {
        try {
            const contacts = await contactService.findAll();
            return response200(contacts);
        } catch (error) {
            return error; // Service methods throw errors with proper status and message
        }
    })
    .build();
```

> ⚠️ **Important Note**: `buildResponseCodes` registers many response codes (200, 400, 401, 403, 404, 409, 422, 429, 500, 503) which can complicate Swagger documentation. For most cases, it's recommended to use either:
> - `buildExtraResponseCodes` which registers only essential codes (200, 400, 401, 403)
> - `useResponseSchemas` which also registers only essential codes (200, 400, 401, 403)

### 3. Using Response Schemas (Recommended)

Using response schemas for type-safe error handling with minimal response codes:

```typescript
import { useResponseSchemas, Type } from '@tsdiapi/server';

const ContactSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

const ValidationErrorSchema = Type.Object({
    field: Type.String(),
    message: Type.String()
});

const { codes, sendSuccess, sendError } = useResponseSchemas(
    ContactSchema,
    ValidationErrorSchema
);

useRoute("contacts")
    .post("/")
    .version('1')
    .codes(codes) // Registers only 200, 400, 401, 403
    .handler(async (req) => {
        try {
            const contact = await contactService.create(req.body);
            return sendSuccess(contact);
        } catch (error) {
            return error; // Service methods throw errors with proper status and message
        }
    })
    .build();
```

### 4. Using buildExtraResponseCodes (Recommended)

A more focused approach that registers only essential response codes:

```typescript
import { buildExtraResponseCodes, Type } from '@tsdiapi/server';

const ContactSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
});

const ErrorSchema = Type.Object({
    error: Type.String(),
    details: Type.Optional(Type.String())
});

useRoute("contacts")
    .post("/")
    .version('1')
    .codes(buildExtraResponseCodes(ContactSchema, ErrorSchema)) // Registers only 200, 400, 401, 403
    .handler(async (req) => {
        try {
            const contact = await contactService.create(req.body);
            return response200(contact);
        } catch (error) {
            return error; // Service methods throw errors with proper status and message
        }
    })
    .build();
```

### 5. Using Response Error Functions

Using specific error response functions:

```typescript
import { 
    responseSuccess,
    response200,
    response400,
    response401,
    response403,
    response404,
    response422,
    response500
} from '@tsdiapi/server';

const ValidationErrorSchema = Type.Object({
    field: Type.String(),
    message: Type.String()
});

useRoute("contacts")
    .post("/")
    .version('1')
    .codes(buildExtraResponseCodes(ContactSchema, ValidationErrorSchema)) // Use buildExtraResponseCodes instead
    .handler(async (req) => {
        try {
            const contact = await contactService.create(req.body);
            return responseSuccess(contact);
        } catch (error) {
            return error; // Service methods throw errors with proper status and message
        }
    })
    .build();
```

## 🔒 Best Practices

1. **Service Layer Error Handling**:
   - Service methods MUST throw errors with proper status codes and messages
   - Use built-in error types from `@tsdiapi/server`:
     ```typescript
     import { ResponseBadRequest, ResponseInternalServerError } from '@tsdiapi/server';
     
     @Service()
     class ContactService {
         async findById(id: string) {
             const contact = await this.prisma.contact.findUnique({ where: { id } });
             if (!contact) {
                 throw new ResponseBadRequest(`Contact with ID ${id} not found`);
             }
             return contact;
         }
     }
     ```
   - Route handlers should simply catch and return these errors:
     ```typescript
     try {
         const contact = await contactService.findById(id);
         return response200(contact);
     } catch (error) {
         return error; // Service methods throw errors with proper status and message
     }
     ```

2. **Response Codes Registration**:
   - Prefer `useResponseSchemas` or `buildExtraResponseCodes` over `buildResponseCodes`
   - These methods register only essential response codes (200, 400, 401, 403)
   - This keeps Swagger documentation clean and focused
   - Additional response codes can be registered manually if needed:
     ```typescript
     .codes(buildExtraResponseCodes(ContactSchema, ErrorSchema))
     .code(404, ErrorSchema) // Add specific codes manually
     ```

3. **Include Error Details**:
   ```typescript
   const ValidationErrorDetails = Type.Object({
     field: Type.String(),
     message: Type.String()
   });

   const ErrorDetailsSchema = Type.Object({
     errors: Type.Array(ValidationErrorDetails)
   });

   const { register: errorRegister, send: sendError } = useResponseErrorSchema(400, ErrorDetailsSchema);
   useRoute("contacts")
   .post("/")
   .code(...errorRegister)
   .handler(async (req) => {
    try {
        const contact = await contactService.create(req.body);
        return response200(contact);
    } catch (error) {
        return sendError(`Invalid input`, {
            errors: [{
                field: "email",
                message: "Invalid email format"
            }]
        })
    }
   });
   ```

4. **Use Type-Safe Schemas**:
   ```typescript
   const { codes, sendError, sendSuccess } = useResponseSchemas(
       SuccessSchema,
       ErrorSchema
   );
   ```

5. **Handle Async Errors**:
   ```typescript
   import { ResponseError, response400 } from '@tsdiapi/server';
   try {
       await someAsyncOperation();
   } catch (error) {
       return  error instanceof ResponseError ? error : response400("Invalid input");
   }
   ```

## 📚 Additional Resources

- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Fastify Error Handling](https://www.fastify.io/docs/latest/Reference/Errors/) 