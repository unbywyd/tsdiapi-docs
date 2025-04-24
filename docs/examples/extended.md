# Extended Example

Example that will help generate code using AI, you need to follow all examples and rules below:

## Date Type

Always use `DateString` from `@tsdiapi/server` for date fields instead of `Type.String({ format: "date-time" })`:

```typescript
import { DateString } from "@tsdiapi/server";

// Correct
createdAt: DateString();

// Incorrect
createdAt: Type.String({ format: "date-time" });
```

## File Type

Always use `Type.String({ format: "binary" })` for file fields:

```typescript
// Correct
file: Type.String({ format: "binary" });

// Incorrect
file: Type.String();
```

## Response Codes

Every route MUST register ALL possible response codes immediately after the HTTP method definition. This includes:

- Success codes (200 for all successful operations, including POST)
- Error codes (400, 401, 403, 404, 500, etc.)
- Each code MUST have a corresponding schema
- All possible error scenarios MUST be documented
- For authenticated routes, 403 response code with `error: string` schema is REQUIRED

Use `buildResponseCodes` from `@tsdiapi/server` to register all possible response codes immediately after the HTTP method definition.

```typescript
// Correct to all defined possible codes
useRoute("articles")
  .post("/")
  .codes(buildResponseCodes(ArticleSchema, ValidationErrorSchema)) // Success and error codes
  .summary("Create article")
  .auth("bearer") // Authentication
  .guard(JWTGuard()); // Guard
// ... rest of the route definition

// Correct
useRoute("articles")
  .post("/")
  .code(201, ArticleSchema) // Wrong: should be 200
  .code(400, ErrorSchema) // Validation error
  .code(403, ErrorSchema) // Forbidden (REQUIRED for auth)
  .code(500, ErrorSchema) // Server error
  .summary("Create article")
  .auth("bearer"); // Authentication before codes
// ... rest of the route definition

// Correct and recommended!
const ContactSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
});
const ValidationErrorSchema = Type.Object({
  field: Type.String(),
  message: Type.String(),
});
const { codes, sendError, sendSuccess, send } = useResponseSchemas(
  ContactSchema,
  ValidationErrorSchema
);
useRoute("contacts")
  .post("/")
  .version("1")
  .codes(codes)
  .handler(async (req) => {
    try {
      const contact = await createContact(req.body);
      return sendSuccess(contact);
    } catch (error) {
      return sendError("Validation failed", {
        field: "email",
        message: "Invalid email format",
      });
    }
  });

// Incorrect (too many repetitions) use buildResponseCodes instead or buildExtraResponseCodes
useRoute("articles")
  .post("/")
  .code(201, ArticleSchema) // Wrong: should be 200
  .code(400, ErrorSchema) // Validation error
  .code(401, ErrorSchema) // Unauthorized
  .code(503, ErrorSchema) // Service unavailable
  .code(403, ErrorSchema) // Forbidden (REQUIRED for auth)
  .code(404, ErrorSchema) // Not found
  .code(500, ErrorSchema) // Server error
  .summary("Create article")
  .auth("bearer"); // Authentication before codes
// ... rest of the route definition
```

## buildExtraResponseCodes

> ⚠️ **Important**: Always prefer `buildExtraResponseCodes` over `buildResponseCodes` for better performance and cleaner Swagger documentation.

### Why buildExtraResponseCodes is Recommended

1. **Performance Impact**:

   - Each registered response code adds overhead to route initialization
   - More codes = more memory usage and slower startup
   - Swagger documentation becomes larger and slower to generate
   - Route validation becomes more complex with many codes

2. **Cleaner Documentation**:

   - `buildExtraResponseCodes` registers only essential codes:
     ```typescript
     200: successSchema,  // Success response
     400: errorSchema,    // Bad request
     401: errorSchema,    // Unauthorized
     403: errorSchema     // Forbidden
     ```
   - This keeps Swagger UI clean and focused
   - Makes API documentation more maintainable

3. **Best Practices**:

   ```typescript
   // ✅ Recommended: Use buildExtraResponseCodes
   useRoute("contacts")
     .get("/")
     .codes(buildExtraResponseCodes(ContactSchema, ErrorSchema))
     .handler(async (req) => {
       try {
         const contacts = await contactService.findAll();
         return responseSuccess(contacts);
       } catch (error) {
         return error instanceof ResponseError
           ? error
           : response400("Invalid input");
       }
     })
     .build();

   // ❌ Not recommended: Using buildResponseCodes
   useRoute("contacts")
     .get("/")
     .codes(buildResponseCodes(ContactSchema, ErrorSchema)) // Registers too many codes
     .handler(async (req) => {
       // ... handler code
     })
     .build();
   ```

4. **When to Add Extra Codes**:

   - Add specific codes only when they're actually used:
     ```typescript
     useRoute("contacts")
       .get("/")
       .codes(buildExtraResponseCodes(ContactSchema, ErrorSchema))
       .code(404, ErrorSchema) // Add only if needed
       .handler(async (req) => {
         // ... handler code
       })
       .build();
     ```

5. **Performance Considerations**:
   - Each additional code increases:
     - Memory usage
     - Route initialization time
     - Swagger documentation size
     - Validation complexity
   - Keep response codes minimal for better performance

## Session Handling

The session object contains all the data that was included in the JWT token when it was created. For example, if you signed in with:

```typescript
const token = await authProvider.signIn({
  userId: "123",
  role: "admin",
  permissions: ["read", "write"],
});
```

Then in your route handler, you can access all these fields:

```typescript
const { userId, role, permissions } = req.session;
```

For type-safe session access, you can use `useSession` from `@tsdiapi/jwt-auth`:

```typescript
import { JWTGuard, useSession } from "@tsdiapi/jwt-auth";

// Define your session type
type UserSession = {
  userId: string;
  role: string;
  permissions: string[];
};

useRoute("profile")
  .get("/")
  .codes(buildResponseCodes(ProfileSchema, ValidationErrorSchema))
  .summary("Get user profile")
  .auth("session")
  .handler(async (req) => {
    // Get type-safe session
    const session = useSession<UserSession>(req);

    // Now you have full type checking and autocompletion
    const userId = session.userId;
    const role = session.role;
    const permissions = session.permissions;

    const profile = await userService.getProfile(userId);
    return responseSuccess(profile);
  })
  .build();
```

Common session properties:

- `...other fields from JWT token`

Note: All custom data passed to `authProvider.signIn()` will be available in `req.session` in your route handlers.

## Error Handling

Use built-in error types from `@tsdiapi/server` and proper error handling in services and handlers:

### Service Layer Error Handling

```typescript
import {
  ResponseBadRequest,
  ResponseNotFound,
  ResponseInternalServerError,
} from "@tsdiapi/server";

@Service()
export class ContactService {
  private prisma = usePrisma<PrismaClient>();

  async createContact(data: {
    name?: string;
    telegram?: string;
    phoneNumber?: string;
    hasWhatsapp?: boolean;
    userId: string;
  }) {
    try {
      return await this.prisma.contact.create({
        data: {
          name: data.name,
          telegram: data.telegram,
          phoneNumber: data.phoneNumber,
          hasWhatsapp: data.hasWhatsapp,
          userId: data.userId,
        },
      });
    } catch (error) {
      throw new ResponseBadRequest("Failed to create contact");
    }
  }

  async getContactById(id: string) {
    try {
      const contact = await this.prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        throw new ResponseNotFound(`Contact with ID ${id} not found`);
      }

      return contact;
    } catch (error) {
      if (error instanceof ResponseNotFound) throw error;
      throw new ResponseInternalServerError("Failed to get contact");
    }
  }
}
```

### Route Handler Error Handling

```typescript
import {
  buildResponseCodes,
  responseSuccess,
  ResponseBadRequest,
  ResponseNotFound,
  ResponseInternalServerError,
} from "@tsdiapi/server";

useRoute("contacts")
  .get("/:id")
  .version("1")
  .codes(buildResponseCodes(ContactSchema, ValidationErrorSchema))
  .handler(async (req) => {
    try {
      const contact = await contactService.getContactById(req.params.id);
      return responseSuccess(contact);
    } catch (error) {
      // Error is already a proper response object
      return error;
    }
  })
  .build();
```

## Entity Relationships

When working with related entities in Prisma, use the following patterns:

```typescript
// Setting a relationship (one-to-one or one-to-many)
await prisma.entity.update({
  where: { id: entityId },
  data: {
    relatedEntity: {
      connect: { id: relatedId }
    }
  }
});

// Removing a relationship
await prisma.entity.update({
  where: { id: entityId },
  data: {
    relatedEntity: {
      disconnect: true
    }
  }
});

// Example from contacts.service.ts
async setMainContact(userId: string, contactId: string) {
  try {
    const contact = await this.getContactById(contactId);

    if (contact.userId !== userId) {
      throw new ResponseNotFound(contactId);
    }

    // First, remove main contact from any other contacts
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mainContact: {
          disconnect: true
        }
      }
    });

    // Set the new main contact
    return await this.prisma.contact.update({
      where: { id: contactId },
      data: { mainUserContact: { connect: { id: userId } } }
    });
  } catch (error) {
    if (error instanceof ResponseNotFound) throw error;
    throw new ResponseInternalServerError("Failed to set main contact");
  }
}
```

## Optional Fields and Complex Queries

When defining schemas with optional fields or complex query parameters:

```typescript
// Schema with optional fields
const ContactSchema = Type.Object({
  name: Type.Optional(Type.String()),
  telegram: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  hasWhatsapp: Type.Optional(Type.Boolean())
});

// Complex query parameters
.query(
  Type.Object({
    name: Type.Optional(Type.String()),
    telegram: Type.Optional(Type.String()),
    phoneNumber: Type.Optional(Type.String()),
    hasWhatsapp: Type.Optional(Type.Boolean())
  })
)

// Service method with complex filtering
async listContacts(userId: string, filters?: {
  name?: string;
  telegram?: string;
  phoneNumber?: string;
  hasWhatsapp?: boolean;
}) {
  try {
    return this.prisma.contact.findMany({
      where: {
        userId,
        ...filters
      },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    throw new ResponseInternalServerError("Failed to list contacts");
  }
}
```

## Service Layer Best Practices

1. Always wrap database operations in try-catch blocks
2. Use built-in error types from `@tsdiapi/server`
3. Handle relationships carefully
4. Use TypeDI for dependency injection
5. Keep business logic in the service layer
6. Always validate user ownership before operations

```typescript
@Service()
export class EntityService {
  private prisma = usePrisma<PrismaClient>();

  async createEntity(data: {
    name?: string;
    // ... other optional fields
    requiredField: string;
    userId: string; // Always include userId for ownership
  }) {
    try {
      return await this.prisma.entity.create({
        data: {
          name: data.name,
          requiredField: data.requiredField,
          userId: data.userId,
        },
      });
    } catch (error) {
      throw new ResponseBadRequest("Failed to create entity");
    }
  }

  // Always check ownership
  async updateEntity(id: string, userId: string, data: Partial<Entity>) {
    try {
      const entity = await this.getEntityById(id);
      if (entity.userId !== userId) {
        throw new ResponseNotFound(id);
      }
      // ... rest of the update logic
    } catch (error) {
      if (error instanceof ResponseNotFound) throw error;
      throw new ResponseInternalServerError("Failed to update entity");
    }
  }
}
```

## Controller Naming and API Versioning

### Controller Naming

You can specify the controller name in two ways:

1. Directly in `useRoute()`:

```typescript
useRoute("contacts")
  .get("/")
  .version("1")
  .code(200, Type.Array(ContactSchema))
  .build();
```

2. Using the `.controller()` method:

```typescript
useRoute()
  .controller("contacts")
  .get("/")
  .version("1")
  .code(200, Type.Array(ContactSchema))
  .build();
```

Both approaches are valid, but each route must be defined separately:

```typescript
// Correct - separate route definitions
useRoute()
  .controller("contacts")
  .get("/")
  .version("1")
  .code(200, Type.Array(ContactSchema))
  .build();

useRoute()
  .controller("contacts")
  .get("/:id")
  .version("1")
  .code(200, ContactSchema)
  .code(404, ErrorSchema)
  .build();

// Incorrect - multiple methods on same route
useRoute()
  .controller("contacts")
  .get("/") // Wrong: multiple methods
  .get("/:id") // Wrong: multiple methods
  .post("/") // Wrong: multiple methods
  .put("/:id") // Wrong: multiple methods
  .delete("/:id"); // Wrong: multiple methods
```

### API Versioning

Always specify API version for each route using `.version()`. This helps maintain backward compatibility. Each route must be defined separately:

```typescript
// List contacts
useRoute("contacts")
  .get("/")
  .version("1")
  .code(200, Type.Array(ContactSchema))
  .code(400, ErrorSchema)
  .summary("Get contacts list")
  .tags(["Contacts"])
  .auth("bearer")
  .guard(JWTGuard())
  .handler(async (req) => {
    // ... handler implementation
  })
  .build();

// Get contact by ID
useRoute("contacts")
  .get("/:id")
  .version("1")
  .code(200, ContactSchema)
  .code(404, ErrorSchema)
  .summary("Get contact by ID")
  .tags(["Contacts"])
  .auth("bearer")
  .guard(JWTGuard())
  .params(Type.Object({ id: Type.String() }))
  .handler(async (req) => {
    // ... handler implementation
  })
  .build();

// Create contact
useRoute("contacts")
  .post("/")
  .version("1")
  .code(201, ContactSchema)
  .code(400, ErrorSchema)
  .summary("Create contact")
  .tags(["Contacts"])
  .auth("bearer")
  .guard(JWTGuard())
  .body(ContactSchema)
  .handler(async (req) => {
    // ... handler implementation
  })
  .build();
```

### Versioning Best Practices

1. Always specify version for each route
2. Use semantic versioning (e.g., "1", "2", etc.)
3. When making breaking changes, increment the major version
4. Document version changes in API changelog
5. Support multiple versions simultaneously for backward compatibility
6. Each route must be defined separately with a single HTTP method

## Feature Structure

A feature is any directory in `src/api` that contains at least two required files:

- `name.service.ts` - Contains business logic
- `name.module.ts` - Contains route definitions

Example structure:

```
src/
└── api/
    └── articles/           # Feature directory
        ├── articles.service.ts  # Business logic
        ├── articles.module.ts   # Route definitions
        ├── articles.errors.ts   # Custom errors (optional)
        └── articles.types.ts    # Type definitions (optional)
```

The feature name is determined by the directory name and must match the prefix of the service and module files.

## TypeBox Schema Generation

All Prisma models are automatically generated into TypeBox schemas in `@base/api/typebox-schemas/models`. If a schema is not available there, create it in the feature's `name.types.ts` file.

```typescript
// Import schemas from generated models
import { OutputContactSchema } from "@base/api/typebox-schemas/models/OutputContactSchema.model.js";
import { InputContactSchema } from "@base/api/typebox-schemas/models/InputContactSchema.model.js";

// Use Output schemas for responses
.code(200, OutputContactSchema)  // For response data

// Use Input schemas for request bodies
.body(InputContactSchema)        // For request data
```
### 1. First, let's create a service (`articles.service.ts`):

```typescript
/* ──────────────────────────────────────────────────────────────
   src/api/features/articles/articles.service.ts
   Full-featured service for working with articles and comments
   with error handling and DI through TypeDI
──────────────────────────────────────────────────────────────── */
import { Service } from "typedi";
import { usePrisma } from "@tsdiapi/prisma";
import { PrismaClient } from "@generated/prisma/client.js";
import {
  response400,
  response404,
  response403,
  response500,
} from "@tsdiapi/server";

@Service()
export class ArticlesService {
  private prisma = usePrisma<PrismaClient>();

  /* CRUD для статей ─────────────────────────────────────────── */
  async createArticle(data: {
    title: string;
    content: string;
    authorId: string;
    status?: ArticleStatus;
  }) {
    try {
      return await this.prisma.article.create({
        data: {
          title: data.title,
          content: data.content,
          authorId: data.authorId,
          status: data.status || "draft",
        },
      });
    } catch (error) {
      throw response500("Failed to create article");
    }
  }

  async getArticleById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { comments: true },
    });

    if (!article) {
      throw response404(`Article with ID ${id} not found`);
    }

    return article;
  }

  async updateArticle(
    id: string,
    data: Partial<{
      title: string;
      content: string;
      status: ArticleStatus;
    }>
  ) {
    try {
      if (
        data.status &&
        !["draft", "published", "archived"].includes(data.status)
      ) {
        throw response400(`Invalid article status: ${data.status}`);
      }

      const updated = await this.prisma.article.update({
        where: { id },
        data,
      });

      return updated;
    } catch (error) {
      if (error.status === 400) throw error;
      throw response500("Failed to update article");
    }
  }

  async deleteArticle(id: string) {
    try {
      await this.prisma.article.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw response500("Failed to delete article");
    }
  }

  async listArticles(options: {
    page?: number;
    limit?: number;
    status?: ArticleStatus;
  }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    return this.prisma.article.findMany({
      where: status ? { status } : undefined,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  /* Методы для комментариев ─────────────────────────────────── */
  async addComment(
    articleId: string,
    data: { text: string; authorId: string }
  ) {
    try {
      return await this.prisma.comment.create({
        data: {
          text: data.text,
          authorId: data.authorId,
          articleId,
        },
      });
    } catch (error) {
      throw response500("Failed to add comment");
    }
  }

  async getCommentById(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw response404(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async updateComment(id: string, text: string) {
    try {
      return await this.prisma.comment.update({
        where: { id },
        data: { text },
      });
    } catch (error) {
      throw response500("Failed to update comment");
    }
  }

  async deleteComment(id: string) {
    try {
      await this.prisma.comment.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw response500("Failed to delete comment");
    }
  }

  /* Файловые операции ──────────────────────────────────────── */
  async attachFile(articleId: string, filePath: string) {
    try {
      return await this.prisma.article.update({
        where: { id: articleId },
        data: { attachments: { push: filePath } },
      });
    } catch (error) {
      throw response500("Failed to attach file");
    }
  }

  /* Экспорт данных ──────────────────────────────────────────── */
  async exportArticlesToCsv(): Promise<Buffer> {
    try {
      const articles = await this.prisma.article.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      });

      const headers = "id,title,status,createdAt\n";
      const csv =
        headers +
        articles
          .map(
            (a) =>
              `${a.id},"${a.title.replace(/"/g, '""')}",${
                a.status
              },${a.createdAt.toISOString()}`
          )
          .join("\n");

      return Buffer.from(csv, "utf8");
    } catch (error) {
      throw response500("Failed to export articles");
    }
  }
}
```

### 2. Now let's create a module (`articles.module.ts`):

```typescript
/* ──────────────────────────────────────────────────────────────
   src/api/features/articles/articles.module.ts
   Full-featured module with all possible route types
──────────────────────────────────────────────────────────────── */
import { AppContext, DateString } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { Container } from "typedi";
import { JWTGuard } from "@tsdiapi/jwt-auth";
import { FastifyReply } from "fastify";
import { ArticlesService } from "./articles.service.js";
import { OutputTsdiapiSchema } from "@base/api/typebox-schemas/models/OutputTsdiapiSchema.model.js";
import { useResponseSchemas } from "@tsdiapi/server";

// Схемы для валидации
const ErrorSchema = Type.Object({ error: Type.String() });
const ValidationErrorSchema = Type.Object({
  field: Type.String(),
  message: Type.String(),
});

// Enum для статусов статей
const ArticleStatusEnum = Type.String({
  enum: ["draft", "published", "archived"],
  description: "Article status",
});

// Схема статьи
const ArticleSchema = Type.Intersect([
  OutputTsdiapiSchema,
  Type.Object({
    title: Type.String(),
    content: Type.String(),
    status: ArticleStatusEnum,
    authorId: Type.String(),
    createdAt: DateString(),
  }),
]);

// Схема комментария
const CommentSchema = Type.Object({
  id: Type.String(),
  text: Type.String(),
  authorId: Type.String(),
  articleId: Type.String(),
  createdAt: DateString(),
});

export default function ArticlesModule({ useRoute }: AppContext): void {
  const service = Container.get(ArticlesService);
  const { codes, sendSuccess, sendError } = useResponseSchemas(
    ArticleSchema,
    ValidationErrorSchema
  );

  /* CRUD для статей ─────────────────────────────────────────── */

  // Create article (with JWT authentication)
  useRoute("articles")
    .post("/")
    .codes(codes)
    .summary("Create article")
    .description("Creates a new article in the system")
    .tags(["Articles"])
    .auth("bearer")
    .guard(JWTGuard())
    .body(Type.Omit(ArticleSchema, ["id", "createdAt"]))
    .handler(async (req) => {
      try {
        const article = await service.createArticle({
          ...req.body,
          authorId: req.user.id,
        });
        return sendSuccess(article);
      } catch (error) {
        return error instanceof ResponseError
          ? error
          : response400("Failed to create article");
      }
    })
    .build();

  // Get article by ID
  useRoute("articles/:id")
    .get("/")
    .codes(codes)
    .summary("Get article by ID")
    .tags(["Articles"])
    .params(Type.Object({ id: Type.String() }))
    .handler(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        return sendSuccess(article);
      } catch (error) {
        return error instanceof ResponseError
          ? error
          : response400("Failed to get article");
      }
    })
    .build();

  // Update article
  useRoute("articles/:id")
    .put("/")
    .codes(codes)
    .summary("Update article")
    .tags(["Articles"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ id: Type.String() }))
    .body(
      Type.Partial(Type.Omit(ArticleSchema, ["id", "authorId", "createdAt"]))
    )
    .handler(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        if (article.authorId !== req.user.id) {
          return sendError("Forbidden", {
            field: "authorId",
            message: "You don't have permission to update this article",
          });
        }

        const updated = await service.updateArticle(req.params.id, req.body);
        return sendSuccess(updated);
      } catch (error) {
        return error instanceof ResponseError
          ? error
          : response400("Failed to update article");
      }
    })
    .build();

  // Delete article
  useRoute("articles/:id")
    .delete("/")
    .codes(codes)
    .summary("Delete article")
    .tags(["Articles"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ id: Type.String() }))
    .handler(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        if (article.authorId !== req.user.id) {
          return sendError("Forbidden", {
            field: "authorId",
            message: "You don't have permission to delete this article",
          });
        }

        await service.deleteArticle(req.params.id);
        return sendSuccess({ success: true });
      } catch (error) {
        return error instanceof ResponseError
          ? error
          : response400("Failed to delete article");
      }
    })
    .build();

  // ... rest of the module code ...
}
```

