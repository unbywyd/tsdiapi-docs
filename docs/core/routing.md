# Routing

TSDIAPI provides a powerful and flexible routing system that leverages TypeScript's type safety and Fastify's performance.

## Automatic Route Loading

The TSDI API server automatically loads routes from specific files in your project during server initialization.

### File Naming Convention

The server looks for two types of files:

1. `*.module.ts` - Module files containing route definitions
2. `*.load.ts` - Loader files for additional route setup

### Module Structure

Each module file should export a default function that takes an `AppContext` as its parameter:

```typescript
// feature.module.ts
import {
  useResponseSchemas,
  ResponseErrorSchema,
  responseSuccess,
  responseBadRequest,
} from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

const FeatureSchema = Type.Object({
  message: Type.String(),
});

export default function FeatureModule({ useRoute }: AppContext): void {
  useRoute("feature")
    .get("/text")
    .version("1")
    .code(200, FeatureSchema)
    .code(400, ResponseErrorSchema)
    .handler(async (req) => {
      try {
        // Response with 200 status code
        return responseSuccess({ message: "Hello, world!" });
      } catch (error) {
        // Response with 400 status code
        return error instanceof ResponseError
          ? error
          : responseBadRequest("Failed to get text");
      }
    })
    .build();
}
```

### Loader Files

Loader files (`*.load.ts`) are used for:

- Setting up route middleware
- Configuring global route options
- Registering route hooks
- Setting up authentication strategies

```typescript
// auth.load.ts
import { useResponseSchemas } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

const ErrorSchema = Type.Object({
  error: Type.String(),
});

export default function AuthLoader({ useRoute }: AppContext): void {
  // ...
}
```

## Basic Usage

The routing system provides a type-safe, fluent API for defining routes. Here's a basic example:

```typescript
import { useResponseSchemas } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { Container } from "typedi";

const FeatureSchema = Type.Object({
  message: Type.String(),
});

const ErrorDetailsSchema = Type.Object({
  field: Type.String(),
  message: Type.String(),
});

export default function FeatureModule({ useRoute }: AppContext): void {
  // Multiple response schemas
  const { codes, sendSuccess, sendError } = useResponseSchemas(
    FeatureSchema,
    ErrorDetailsSchema
  );

  useRoute("feature")
    .get("/")
    .version("1")
    .codes(codes)
    .handler(async (req) => {
      try {
        const service = Container.get(FeatureService);
        const hello = await service.getHello();
        return sendSuccess({ message: hello });
      } catch (error) {
        return error instanceof ResponseError
          ? error
          : sendError("Failed to get hello", {
              field: "message",
              message: "Failed to get hello",
            });
      }
    })
    .build();
}
```

### About build() method

The `build()` method is crucial for route definition. It:

1. Finalizes the route configuration
2. Registers the route in the Fastify instance
3. Validates the route configuration
4. Applies all middleware and hooks
5. Sets up request/response schemas

**Important**: Every route definition must end with `.build()` to be registered.

## Route Configuration

### Controller and URL

```typescript
import { useResponseSchemas } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";

const UserSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

const ErrorSchema = Type.Object({
  error: Type.String(),
});

export default function UserModule({ useRoute }: AppContext): void {
  const { codes, sendSuccess } = useResponseSchemas(
    UserSchema,
    ErrorSchema
  );

  useRoute("users")
    .get("/")
    .version("1")
    .codes(codes)
    .handler(async (req) => {
      try {
        const users = await userService.findAll();
        return sendSuccess(users);
      } catch (error) {
        return error instanceof ResponseError
          ? error
          : response400("Failed to get users");
      }
    })
    .build();
}
```

### Request Parameters with Validation

```typescript
useRoute("feature/:id")
  .get("/")
  .version("1")
  .codes(codes)
  .params(
    Type.Object({
      id: Type.String({
        pattern: "^[0-9a-fA-F]{24}$", // MongoDB ObjectId pattern
      }),
    })
  )
  .handler(async (req) => {
    try {
      const feature = await featureService.findById(req.params.id);
      return responseSuccess(feature);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to get feature");
    }
  })
  .build();
```

### Request Body with Validation

```typescript
import { responseSuccess, response400 } from "@tsdiapi/server";
useRoute("feature")
  .post("/")
  .version("1")
  .codes(codes)
  .body(
    Type.Object({
      name: Type.String(),
      age: Type.Number({
        minimum: 0,
        maximum: 120,
      }),
      address: Type.Object({
        street: Type.String(),
        city: Type.String(),
        zip: Type.String({
          pattern: "^\\d{5}(-\\d{4})?$",
        }),
      }),
    })
  )
  .handler(async (req) => {
    try {
      const feature = await featureService.create(req.body);
      return responseSuccess(feature);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to create feature");
    }
  })
  .build();
```

## Guards

Guards are used to protect routes and can return either a boolean or a response object:

```typescript
useRoute("feature")
  .get("/")
  .version("1")
  .codes(codes)
  .guard(async (req) => {
    if (!req.headers.authorization) {
      return sendError("Unauthorized");
    }
    return true;
  })
  .handler(async (req) => {
    try {
      const feature = await featureService.getFeature();
      return responseSuccess(feature);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to get feature");
    }
  })
  .build();
```

## File Uploads

```typescript
useRoute("feature")
  .post("/upload")
  .version("1")
  .codes(codes)
  .acceptMultipart()
  .body(
    Type.Object({
      avatar: Type.String({ format: "binary" }),
      document: Type.String({ format: "binary" }),
      metadata: Type.Object({
        title: Type.String(),
        description: Type.String(),
      }),
    })
  )
  .fileOptions(
    {
      maxFileSize: 1024 * 1024 * 5, // 5MB
      accept: ["image/jpeg", "image/png"],
    },
    "avatar"
  )
  .fileOptions(
    {
      maxFileSize: 1024 * 1024 * 10, // 10MB
      accept: ["application/pdf", "application/msword"],
    },
    "document"
  )
  .handler(async (req) => {
    try {
      const s3provider = useS3Provider();
      const uploads = await Promise.all([
        s3provider.uploadToS3({
          buffer: req.tempFiles[0].buffer,
          mimetype: req.tempFiles[0].mimetype,
          originalname: req.tempFiles[0].filename,
        }),
        s3provider.uploadToS3({
          buffer: req.tempFiles[1].buffer,
          mimetype: req.tempFiles[1].mimetype,
          originalname: req.tempFiles[1].filename,
        }),
      ]);
      return sendSuccess({
        urls: {
          avatar: uploads[0].url,
          document: uploads[1].url,
        },
      });
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to upload files");
    }
  })
  .build();
```

## Response Formats

The routing system supports various response formats:

### JSON Response (default)

```typescript
useRoute("feature")
  .get("/data")
  .version("1")
  .codes(codes)
  .handler(async (req) => {
    try {
      const data = await featureService.getData();
      return sendSuccess(data);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to get data");
    }
  })
  .build();
```

### Binary Response

```typescript
useRoute("feature")
  .get("/download")
  .version("1")
  .binary()
  .handler(async (req) => {
    try {
      const fileBuffer = await getFileBuffer();
      return fileBuffer;
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to download file");
    }
  })
  .build();
```

### Text Response

```typescript
useRoute("feature")
  .get("/text")
  .version("1")
  .text()
  .handler(async (req) => {
    try {
      return "Hello, world!";
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to get text");
    }
  })
  .build();
```

## Swagger Documentation

Enhance your API documentation in Swagger:

```typescript
useRoute("users")
  .post("/")
  .version("1")
  .codes(codes)
  .summary("Create new user")
  .description(
    `
        Creates a new user in the system.
        
        Required permissions:
        - user.create
        
        Rate limiting:
        - 10 requests per minute
    `
  )
  .tags(["Users", "Management"])
  .body(
    Type.Object({
      name: Type.String(),
      email: Type.String(),
      password: Type.String(),
    })
  )
  .handler(async (req) => {
    try {
      const user = await userService.create(req.body);
      return sendSuccess(user);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to create user");
    }
  })
  .build();
```

## Authentication

The routing system supports different authentication methods:

### Bearer Token Authentication

```typescript
import { JWTGuard, useSession } from "@tsdiapi/jwt-auth"; // Auth guard and session access
useRoute("feature")
  .get("/protected")
  .version("1")
  .codes(codes)
  .auth("bearer")
  .guard(JWTGuard())
  .handler(async (req) => {
    try {
      const session = useSession<{ userId: string }>(req);
      const data = await featureService.getProtectedData(session.userId);
      return sendSuccess(data);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to get protected data");
    }
  })
  .build();
```

## Resolvers

Resolvers pre-process and validate data before it reaches the handler:

```typescript
import { responseSuccess, ResponseBadRequest, response400 } from "@tsdiapi/server";
useRoute("feature")
  .get("/:id")
  .version("1")
  .codes(codes)
  .params(
    Type.Object({
      id: Type.String(),
    })
  )
  .resolve(async (req) => {
    try {
      const sessionId = req.params.id;
      const session = await client.session.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        throw new ResponseBadRequest("Session not found");
      }
      return session;
    } catch (error) {
      if (error instanceof ResponseError) throw error;
      throw new ResponseBadRequest("Failed to resolve session");
    }
  })
  .handler(async (req) => {
    try {
      const session = req.routeData;
      const data = await featureService.getData(session);
      return sendSuccess(data);
    } catch (error) {
      return error instanceof ResponseError
        ? error
        : response400("Failed to get data");
    }
  })
  .build();
```

## Complete Example

```typescript
// ✅ Import framework utilities and helpers
import {
  DateString,
  AppContext,
  useResponseSchemas,
  ResponseBadRequest,
  ResponseErrorSchema,
  ResponseInternalServerError,
  ResponseForbidden,
  response400,
  responseForbidden,
  responseNull
} from "@tsdiapi/server"; // Core routing and types
import { Type } from "@sinclair/typebox"; // For schema definitions
import { JWTGuard, useSession } from "@tsdiapi/jwt-auth"; // Auth guard and session access
import { Container } from "typedi"; // DI container
import { useS3Provider } from "@tsdiapi/s3"; // S3 provider

// Use @base/api/typebox-schemas/models/index.js models for responses, request bodies and query parameters
// Use this import for responses
// Output to response
import { OutputContactSchema } from "@base/api/typebox-schemas/models/index.js";
// Input to request body
import { InputContactSchema } from "@base/api/typebox-schemas/models/index.js";
// Query to query parameters in list routes
import { QueryListContactSchema, OutputListContactSchema } from "@base/api/typebox-schemas/models/index.js";

import { usePrisma } from "@tsdiapi/prisma";
// Use this import for prisma client
import type { PrismaClient } from "@generated/prisma/index.js";
// Use this function to get prisma client but inside the service method (not outside the function) and pass the prisma client type: usePrisma<PrismaClient>()
import { usePrisma } from "@tsdiapi/prisma";

// ✅ Import service
import { ContactService } from "./contacts.service.js";

// 🔧 Generic reusable schema for all API error messages
// RULE: Use error schema to add details to the error response
const ErrorDetailsSchema = Type.Object({
  errors: Type.Array(Type.Object({
    message: Type.String()
  }))
});

// Add file-related schemas
const OutputUploadSchema = Type.Object({
  url: Type.String(),
  key: Type.String(),
  bucket: Type.String(),
  region: Type.String()
});

// Simple schema with one regular field and one file
import { DateString } from "@tsdiapi/server"; // RULE: Use DateString for date fields!
const InputUploadSchema = Type.Object({
  description: Type.String(),
  dateField: DateString(),
  // RULE: Use Type.String({ format: "binary" }) for file fields
  file: Type.String({ format: "binary" })
});

// Multiple files schema
const InputMultiFilesSchema = Type.Object({
  files: Type.Array(Type.String({ format: "binary" }))
});
// or
const InputWithFilesSchema = Type.Object({
  photo: Type.String({ format: "binary" }),
  document: Type.String({ format: "binary" }),
  // and more fields
});

// ─────────────────────────────────────────────────────────────
// Main module export — loaded automatically by the framework
// File: src/api/contacts/contacts.module.ts
// ─────────────────────────────────────────────────────────────
export default function ContactsModule({ useRoute }: AppContext): void {
  // 🧩 Dependency Injection — retrieve service instance via TypeDI
  const contactService = Container.get(ContactService);

  // Setup response schemas for the module
  const { codes, sendError, sendSuccess, send } = useResponseSchemas(
    OutputContactSchema,
    ErrorDetailsSchema
  );

  // ─────────────────────────────────────────────────────────────
  // GET /contacts — List contacts with optional filters
  // RULES:
  // 1. Every route MUST register ALL possible response codes
  // 2. Success codes use 200 for all operations (including POST)
  // 3. Error codes (400, 401, 403, 404, 500) must be documented
  // 4. For authenticated routes, 403 response is REQUIRED
  // 5. Each code MUST have a corresponding schema
  // ─────────────────────────────────────────────────────────────
  useRoute()
    .controller("contacts") // RULE: Use controller name
    .get("/") // RULE: Use HTTP method and path
    .version("1") // RULE: Always specify API version
    .codes(codes) // Use the predefined response codes
    .summary("List all user contacts") // RULE: Use a meaningful summary, swagger will use it as a description
    .tags(["Contacts"]) // RULE: Use tags for grouping, swagger will use it for grouping
    .auth("bearer") // RULE: Use auth method and guard (import from @tsdiapi/jwt-auth)
    .guard(JWTGuard()) // RULE: Use guard for authentication (import from @tsdiapi/jwt-auth)
    // Then we define the query parameters
    .query(
      Type.Object({
        // RULE: Optional fields must be explicitly marked
        name: Type.Optional(Type.String()),
        telegram: Type.Optional(Type.String()),
        phoneNumber: Type.Optional(Type.String()),
        hasWhatsapp: Type.Optional(Type.Boolean())
      })
    )
    // Then we define the route handler, we can use resolve() for existence check and return error object instead of throwing
    // resolver will be called before handler, and will return the data to the handler in req.routeData as type of the resolver return type
    .resolve(async (req) => {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact) {
        // RULE: When resolver acts as a guard, throw the error instead of returning it
        throw sendError("Contact not found", {
          errors: [{
            message: "Contact not found"
          }]
        });
      }
      return contact;
    })
    // Then we define the route handler, we can use useSession for type-safe session access
    // We can use req.routeData for resolved data
    .handler(async (req) => {
      try {
         // RULE: Use useSession for type-safe session access
      const session = useSession<{ userId: string }>(req);
      const contact = req.routeData; // RULE: Use req.routeData for resolved data
      const data = await contactService.listContacts(session.userId, req.query);
      // We need to return the data with status code 200 registered in the code() method above, data is the return type of the schema registered in the code() method above
        return sendSuccess(data);
      } catch (error) {
        // RULE: Check if error is ResponseError, otherwise return 400 error with message
        return error instanceof ResponseError ? error : response400("Failed to list contacts");
      }
    })
    // We need to build the route, this is required for the route to be registered!
    .build();

  // ─────────────────────────────────────────────────────────────
  // POST /contacts — Create a contact
  // RULES:
  // 1. Use Input schemas for request bodies
  // 2. Success code is 200 (not 201)
  // 3. Always validate user ownership
  // ─────────────────────────────────────────────────────────────
  useRoute()
    .controller("contacts")
    .put("/:id") // RULE: Use HTTP method and path with dynamic route (:id), we need to define the params for the dynamic route see below
    .version("1")
    .codes(buildExtraResponseCodes(InputUploadSchema)) // Use the predefined response codes
    // We need to define the params for the dynamic route (:id), we can use req.params for them
    .params(Type.Object({ id: Type.String() }))
    .summary("Create contact")
    .tags(["Contacts"])
    // We can use auth method and guard, we can use async function for custom validation
    .auth('bearer', async (req, reply) => {
        const isValid = await isBearerValid(req);
        if (!isValid) {
          // Error without payload (details in the error schema)
            return responseForbidden('Invalid access token');
        }
        return true;
    })
    // Use query parameters for optional fields
    .query(Type.Object({
      isPrivate: Type.Boolean()
    }))
    // Required for file fields
    .acceptMultipart() // RULE: Use acceptMultipart() for file fields
    .body(InputUploadSchema) // RULE: Use Input schema for request body
    // RULE: Use fileOptions for file fields validation
    .fileOptions(
      {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        accept: ["image/*", "application/pdf"]
      },
      "file" // Not required, we can use it for set validation rules for the specific file field
    )
    .handler(async (req) => {
      try {
        const params = req.params; // RULE: Use req.params for dynamic route params
        const body = req.body; // RULE: Use req.body for request body
        const { isPrivate } = req.query; // RULE: Use req.query for query parameters
        // RULE: Use useSession for type-safe session access
        const session = useSession<{ userId: string }>(req);
        // RULE: Use req.tempFiles for file fields, this a temp file from the client, we need to save it to the storage and get the url
        const file = req.tempFiles[0];
        // use import { useS3Provider } from "@tsdiapi/s3";
        const s3provider = useS3Provider();
        // Manual upload
        const upload = await s3provider.uploadToS3({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.filename
        }, isPrivate);
        return sendSuccess(upload);
      } catch (error) {
        // RULE: Check if error is ResponseError, otherwise return 400 error with message
        return error instanceof ResponseError ? error : response400("Failed to upload file");
      }
    })
    .build();
  
  /*
  *   Use InputContactSchema for request body
  */
  useRoute()
    .controller("contacts")
    .post("/")
    .version("1")
    .codes(codes)
    .body(InputContactSchema)
    .handler(async (req) => {
      const contact = await contactService.create(req.body);
      return sendSuccess(contact);
    })
    .build();



  // ─────────────────────────────────────────────────────────────
  // DELETE /contacts/:id — Delete a contact
  // RULES:
  // 1. Use resolve() for existence check
  // 2. Return 204 for successful deletion
  // 3. Always check ownership before deletion
  // ─────────────────────────────────────────────────────────────

  useRoute()
    .controller("contacts")
    .delete(":id")
    .version("1")
    .code(204, Type.Null())
    .code(400, ResponseErrorSchema)
    .code(403, ResponseErrorSchema)
    .summary("Delete contact")
    .tags(["Contacts"])
    .auth("bearer")
    // use custom guard for custom validation
    .guard(
      async (req, reply) => {
        const isValid = await isBearerValid(req);
        if (!isValid) {
          return responseForbidden('Invalid access token');
        }
        return true;
      }
    )
    .params(Type.Object({ id: Type.String() }))
    // Resolver acting as a guard - should throw errors
    .resolve(async (req) => {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact) {
        throw new ResponseBadRequest("Contact not found");
      }
      return contact;
    })
    .handler(async (req) => {
      try {
        const session = useSession<{ userId: string }>(req);
        const contact = req.routeData;

        // RULE: Always check ownership
        if (contact.userId !== session.userId) {
          throw new ResponseForbidden("Forbidden");
        }

        await contactService.deleteContact(req.params.id);
        return responseNull();
      } catch (error) {
        return error instanceof ResponseError ? error : response400("Failed to delete contact");
      }
    })
    .build();
```

## List and Query Support

### Schema Types

When working with lists and queries, we use several schema types:

```typescript
// Import schema types from generated models
import { 
    QueryListCitySchema,    // Schema for query parameters in list routes
    OutputListCitySchema,   // Schema for list response (items, total, skip, take)
    InputCitySchema,        // Schema for request body (create/update)
    OutputCitySchema        // Schema for single item response
} from "@base/api/typebox-schemas/models/index.js";

// Example of list route with query support
useRoute()
    .controller("cities")
    .get("/")
    .version("1")
    .query(QueryListCitySchema)  // Use QueryListCitySchema for query parameters
    .codes(codes)
    .summary("List all cities")
    .tags(["Cities"])
    .handler(async (req) => {
        try {
            const { items, total } = await cityService.listCities(req.query);
            return sendSuccess({
                items: items,
                total: total,
                skip: req.query.skip,
                take: req.query.take
            });
        } catch (error) {
            return error instanceof ResponseError ? error : response400("Failed to list cities");
        }
    })
    .build();
```

### Service Implementation

The service layer handles the query parameters and returns paginated results:

```typescript
@Service()
export class CityService {
    async listCities(query: QueryListCitySchemaType) {
        const prisma = usePrisma<PrismaClient>();
        const where: Prisma.CityWhereInput = {
            // Date range filtering
            ...(query.dateAtLte && query.dateAtGte ? {
                createdAt: {
                    lte: query.dateAtLte,
                    gte: query.dateAtGte
                }
            } : {}),
            ...(query?.dateAtGte && !query?.dateAtLte ? {
                createdAt: {
                    gte: query.dateAtGte
                }
            } : {}),
            ...(query?.dateAtLte && !query?.dateAtGte ? {
                createdAt: {
                    lte: query.dateAtLte
                }
            } : {}),
            // Search filtering
            ...(query?.search ? {
                name: {
                    contains: query.search,
                    mode: "insensitive"
                }
            } : {}),
        }

        // Get paginated results
        const results = await prisma.city.findMany({
            take: query.take || 100,
            skip: query.skip || 0,
            ...(query?.orderBy ? {
                [query.orderBy]: query.orderDirection
            } : {}),
            where: where
        });

        // Get total count for pagination
        const total = await prisma.city.count({
            where: where
        });

        return {
            items: results,
            total: total
        }
    }
}
```

### Query Schema Example

The query schema for list operations typically includes:

```typescript
const QueryListCitySchema = Type.Object({
    // Pagination
    skip: Type.Optional(Type.Number()),
    take: Type.Optional(Type.Number()),
    
    // Sorting
    orderBy: Type.Optional(Type.String()),
    orderDirection: Type.Optional(Type.Union([
        Type.Literal("asc"),
        Type.Literal("desc")
    ])),
    
    // Filtering
    search: Type.Optional(Type.String()),
    dateAtGte: Type.Optional(DateString()),
    dateAtLte: Type.Optional(DateString())
});
```

### Response Schema Example

The response schema for list operations includes:

```typescript
const OutputListCitySchema = Type.Object({
    items: Type.Array(OutputCitySchema),
    total: Type.Number(),
    skip: Type.Optional(Type.Number()),
    take: Type.Optional(Type.Number())
});
```

### Best Practices

1. **Query Parameters**:
   - Use `QueryListCitySchema` for list route query parameters
   - Make all query parameters optional with `Type.Optional()`
   - Include pagination parameters (skip, take)
   - Include sorting parameters (orderBy, orderDirection)
   - Include filtering parameters (search, date ranges)

2. **Response Format**:
   - Return paginated results with total count
   - Include skip and take in response for client-side pagination
   - Use consistent response format across all list endpoints

3. **Service Layer**:
   - Handle all query parameters in service layer
   - Implement proper filtering and sorting
   - Return both items and total count
   - Use Prisma's built-in pagination

4. **Error Handling**:
   - Validate query parameters
   - Handle database errors
   - Return appropriate error responses
