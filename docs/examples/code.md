# Code Examples

Example that will help generate code using AI, you need to follow all examples and rules below:

## Date Type
Always use `DateString` from `@tsdiapi/server` for date fields instead of `Type.String({ format: "date-time" })`:

```typescript
import { DateString } from "@tsdiapi/server";

// Correct
createdAt: DateString()

// Incorrect
createdAt: Type.String({ format: "date-time" })
```

## File Type
Always use `Type.String({ format: "binary" })` for file fields:

```typescript
// Correct
file: Type.String({ format: "binary" })

// Incorrect
file: Type.String()
```

## Response Codes
Every route MUST register ALL possible response codes immediately after the HTTP method definition. This includes:
- Success codes (200, 201, 204, etc.)
- Error codes (400, 401, 403, 404, 500, etc.)
- Each code MUST have a corresponding schema
- All possible error scenarios MUST be documented
- For authenticated routes, 403 response code with `error: string` schema is REQUIRED

```typescript
// Correct
useRoute("articles")
  .post("/")
  .code(201, ArticleSchema)  // Success code
  .code(400, ErrorSchema)    // Validation error
  .code(401, ErrorSchema)    // Unauthorized
  .code(403, Type.Object({ error: Type.String() }))    // Forbidden (REQUIRED for auth)
  .code(404, ErrorSchema)    // Not found
  .code(500, ErrorSchema)    // Server error
  .summary("Create article")
  .auth("bearer")           // Authentication
  .guard(JWTGuard())        // Guard
  // ... rest of the route definition

// Incorrect
useRoute("articles")
  .post("/")
  .summary("Create article")
  .code(201, ArticleSchema)  // Missing error codes
  .auth("bearer")           // Authentication before codes
  // ... rest of the route definition
```

## Session Handling
The session object contains all the data that was included in the JWT token when it was created. For example, if you signed in with:

```typescript
const token = await authProvider.signIn({
  userId: "123",
  role: "admin",
  permissions: ["read", "write"]
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
  .code(200, ProfileSchema)
  .code(401, ErrorSchema)
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
    return { status: 200, data: profile };
  })
  .build();
```

Common session properties:
- `...other fields from JWT token`

Note: All custom data passed to `authProvider.signIn()` will be available in `req.session` in your route handlers.

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
// First try to import from generated schemas
import { ArticleSchema } from "@base/api/typebox-schemas/models/ArticleSchema.model.js";

// If not available, create in feature's types file
// src/api/features/articles/articles.types.ts
import { Type } from "@sinclair/typebox";
import { DateString } from "@tsdiapi/server";

export const ArticleSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  content: Type.String(),
  createdAt: DateString()
});
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
  ArticleNotFoundError,
  CommentNotFoundError,
  InvalidStatusError,
  DatabaseError
} from "./articles.errors.js";

// Типы статусов статьи
type ArticleStatus = "draft" | "published" | "archived";

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
          status: data.status || "draft"
        }
      });
    } catch (error) {
      throw new DatabaseError("Failed to create article");
    }
  }

  async getArticleById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { comments: true }
    });

    if (!article) {
      throw new ArticleNotFoundError(id);
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
      if (data.status && !["draft", "published", "archived"].includes(data.status)) {
        throw new InvalidStatusError(data.status);
      }

      const updated = await this.prisma.article.update({
        where: { id },
        data
      });

      return updated;
    } catch (error) {
      if (error instanceof InvalidStatusError) throw error;
      throw new DatabaseError("Failed to update article");
    }
  }

  async deleteArticle(id: string) {
    try {
      await this.prisma.article.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw new DatabaseError("Failed to delete article");
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
      orderBy: { createdAt: "desc" }
    });
  }

  /* Методы для комментариев ─────────────────────────────────── */
  async addComment(articleId: string, data: { text: string; authorId: string }) {
    try {
      return await this.prisma.comment.create({
        data: {
          text: data.text,
          authorId: data.authorId,
          articleId
        }
      });
    } catch (error) {
      throw new DatabaseError("Failed to add comment");
    }
  }

  async getCommentById(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new CommentNotFoundError(id);
    }

    return comment;
  }

  async updateComment(id: string, text: string) {
    try {
      return await this.prisma.comment.update({
        where: { id },
        data: { text }
      });
    } catch (error) {
      throw new DatabaseError("Failed to update comment");
    }
  }

  async deleteComment(id: string) {
    try {
      await this.prisma.comment.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw new DatabaseError("Failed to delete comment");
    }
  }

  /* Файловые операции ──────────────────────────────────────── */
  async attachFile(articleId: string, filePath: string) {
    try {
      return await this.prisma.article.update({
        where: { id: articleId },
        data: { attachments: { push: filePath } }
      });
    } catch (error) {
      throw new DatabaseError("Failed to attach file");
    }
  }

  /* Экспорт данных ──────────────────────────────────────────── */
  async exportArticlesToCsv(): Promise<Buffer> {
    const articles = await this.prisma.article.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });

    const headers = "id,title,status,createdAt\n";
    const csv = headers + articles.map(a => 
      `${a.id},"${a.title.replace(/"/g, '""')}",${a.status},${a.createdAt.toISOString()}`
    ).join("\n");

    return Buffer.from(csv, "utf8");
  }
}
```

### 2. Let's create an errors file (`articles.errors.ts`):

```typescript
/* ──────────────────────────────────────────────────────────────
   src/api/features/articles/articles.errors.ts
   Custom errors for the articles service
──────────────────────────────────────────────────────────────── */
export class ArticleNotFoundError extends Error {
  constructor(id: string) {
    super(`Article with ID ${id} not found`);
    this.name = "ArticleNotFoundError";
  }
}

export class CommentNotFoundError extends Error {
  constructor(id: string) {
    super(`Comment with ID ${id} not found`);
    this.name = "CommentNotFoundError";
  }
}

export class InvalidStatusError extends Error {
  constructor(status: string) {
    super(`Invalid article status: ${status}`);
    this.name = "InvalidStatusError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}
```

### 3. Now let's create a module (`articles.module.ts`):

```typescript
/* ──────────────────────────────────────────────────────────────
   src/api/features/articles/articles.module.ts
   Full-featured module with all possible route types:
   - CRUD for articles and comments
   - Pagination and filtering
   - JWT authentication
   - File uploads
   - Data export
   - Custom guards
──────────────────────────────────────────────────────────────── */
import { AppContext, DateString } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { Container } from "typedi";
import { JWTGuard } from "@tsdiapi/jwt-auth";
import { FastifyReply } from "fastify";
import { ArticlesService } from "./articles.service.js";
import { OutputTsdiapiSchema } from "@base/api/typebox-schemas/models/OutputTsdiapiSchema.model.js";

// Схемы для валидации
const ErrorSchema = Type.Object({ error: Type.String() });
const FileResult = Type.Object({ url: Type.String(), filename: Type.String() });
const ManyFilesRes = Type.Object({ files: Type.Array(FileResult) });

// Enum для статусов статей
const ArticleStatusEnum = Type.String({
  enum: ["draft", "published", "archived"],
  description: "Article status"
});

// Схема статьи
const ArticleSchema = Type.Intersect([
  OutputTsdiapiSchema,
  Type.Object({
    title: Type.String(),
    content: Type.String(),
    status: ArticleStatusEnum,
    authorId: Type.String(),
    createdAt: DateString()
  })
]);

// Схема комментария
const CommentSchema = Type.Object({
  id: Type.String(),
  text: Type.String(),
  authorId: Type.String(),
  articleId: Type.String(),
  createdAt: DateString()
});

export default function ArticlesModule({ useRoute }: AppContext): void {
  const service = Container.get(ArticlesService);

  /* CRUD для статей ─────────────────────────────────────────── */

  // Create article (with JWT authentication)
  useRoute("articles")
    .post("/")
    .code(201, ArticleSchema)  // Success: Article created
    .code(400, ErrorSchema)    // Error: Invalid input data
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Create new article")
    .description("Creates a new article in the system")
    .tags(["Articles"])
    .auth("bearer")
    .guard(JWTGuard())
    .body(Type.Omit(ArticleSchema, ["id", "createdAt"]))
    .handler(async (req) => {
      const article = await service.createArticle({
        ...req.body,
        authorId: req.user.id // From JWT token
      });
      return { status: 201, data: article };
    })
    .build();

  // Get article by ID
  useRoute("articles/:id")
    .get("/")
    .code(200, Type.Intersect([
      ArticleSchema,
      Type.Object({
        comments: Type.Array(CommentSchema)
      })
    ]))  // Success: Article found
    .code(400, ErrorSchema)    // Error: Invalid ID format
    .code(404, ErrorSchema)    // Error: Article not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Get article by ID")
    .tags(["Articles"])
    .params(Type.Object({ id: Type.String() }))
    .resolve(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        return { status: 200, data: article };
      } catch (error) {
        if (error instanceof ArticleNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        throw error;
      }
    })
    .handler(async (req) => req.routeData)
    .build();

  // Update article
  useRoute("articles/:id")
    .put("/")
    .code(200, ArticleSchema)  // Success: Article updated
    .code(400, ErrorSchema)    // Error: Invalid input data
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Article not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Update article")
    .tags(["Articles"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ id: Type.String() }))
    .body(Type.Partial(Type.Omit(ArticleSchema, ["id", "authorId", "createdAt"])))
    .handler(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        if (article.authorId !== req.user.id) {
          return { status: 403, data: { error: "Forbidden" } };
        }

        const updated = await service.updateArticle(req.params.id, req.body);
        return { status: 200, data: updated };
      } catch (error) {
        if (error instanceof ArticleNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        if (error instanceof InvalidStatusError) {
          return { status: 400, data: { error: error.message } };
        }
        throw error;
      }
    })
    .build();

  // Delete article
  useRoute("articles/:id")
    .delete("/")
    .code(204)                 // Success: Article deleted
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Article not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Delete article")
    .tags(["Articles"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ id: Type.String() }))
    .handler(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        if (article.authorId !== req.user.id) {
          return { status: 403, data: { error: "Forbidden" } };
        }

        await service.deleteArticle(req.params.id);
        return { status: 204 };
      } catch (error) {
        if (error instanceof ArticleNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        throw error;
      }
    })
    .build();

  // List articles with pagination and filtering
  useRoute("articles")
    .get("/")
    .code(200, Type.Array(ArticleSchema))  // Success: Articles list
    .code(400, ErrorSchema)                // Error: Invalid query parameters
    .code(500, ErrorSchema)                // Error: Server error
    .summary("Get articles list")
    .tags(["Articles"])
    .query(
      Type.Object({
        page: Type.Number({ minimum: 1, default: 1 }),
        limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
        status: Type.Optional(ArticleStatusEnum)
      })
    )
    .handler(async (req) => ({
      status: 200,
      data: await service.listArticles({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status
      })
    }))
    .build();

  /* CRUD для комментариев ───────────────────────────────────── */

  // Add comment
  useRoute("articles/:articleId/comments")
    .post("/")
    .code(201, CommentSchema)  // Success: Comment created
    .code(400, ErrorSchema)    // Error: Invalid input data
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Article not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Add comment to article")
    .tags(["Articles", "Comments"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ articleId: Type.String() }))
    .body(Type.Object({ text: Type.String() }))
    .handler(async (req) => {
      try {
        await service.getArticleById(req.params.articleId);

        const comment = await service.addComment(req.params.articleId, {
          text: req.body.text,
          authorId: req.user.id
        });
        return { status: 201, data: comment };
      } catch (error) {
        if (error instanceof ArticleNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        throw error;
      }
    })
    .build();

  // Update comment
  useRoute("comments/:id")
    .put("/")
    .code(200, CommentSchema)  // Success: Comment updated
    .code(400, ErrorSchema)    // Error: Invalid input data
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Comment not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Update comment")
    .tags(["Comments"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ id: Type.String() }))
    .body(Type.Object({ text: Type.String() }))
    .handler(async (req) => {
      try {
        const comment = await service.getCommentById(req.params.id);
        if (comment.authorId !== req.user.id) {
          return { status: 403, data: { error: "Forbidden" } };
        }

        const updated = await service.updateComment(req.params.id, req.body.text);
        return { status: 200, data: updated };
      } catch (error) {
        if (error instanceof CommentNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        throw error;
      }
    })
    .build();

  // Delete comment
  useRoute("comments/:id")
    .delete("/")
    .code(204)                 // Success: Comment deleted
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Comment not found
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Delete comment")
    .tags(["Comments"])
    .auth("bearer")
    .guard(JWTGuard())
    .params(Type.Object({ id: Type.String() }))
    .handler(async (req) => {
      try {
        const comment = await service.getCommentById(req.params.id);
        if (comment.authorId !== req.user.id) {
          return { status: 403, data: { error: "Forbidden" } };
        }

        await service.deleteComment(req.params.id);
        return { status: 204 };
      } catch (error) {
        if (error instanceof CommentNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        throw error;
      }
    })
    .build();

  /* Работа с файлами ────────────────────────────────────────── */

  // Upload file to article
  useRoute("articles/:id/attachments")
    .post("/")
    .code(200, ArticleSchema)  // Success: File attached
    .code(400, ErrorSchema)    // Error: Invalid file
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(404, ErrorSchema)    // Error: Article not found
    .code(413, ErrorSchema)    // Error: File too large
    .code(415, ErrorSchema)    // Error: Unsupported file type
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Attach file to article")
    .tags(["Articles", "Files"])
    .auth("bearer")
    .guard(JWTGuard())
    .acceptMultipart()
    .params(Type.Object({ id: Type.String() }))
    .body(Type.Object({ file: Type.String({ format: "binary" }) }))
    .fileOptions(
      {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        accept: ["image/*", "application/pdf"]
      },
      "file"
    )
    .handler(async (req) => {
      try {
        const article = await service.getArticleById(req.params.id);
        if (article.authorId !== req.user.id) {
          return { status: 403, data: { error: "Forbidden" } };
        }

        const file = req.files!.file[0];
        const fileName = `${Date.now()}-${file.filename}`;
        const filePath = `/uploads/${fileName}`;

        const updated = await service.attachFile(req.params.id, filePath);
        return { status: 200, data: updated };
      } catch (error) {
        if (error instanceof ArticleNotFoundError) {
          return { status: 404, data: { error: error.message } };
        }
        throw error;
      }
    })
    .build();

  /* Экспорт данных ──────────────────────────────────────────── */

  // Export articles to CSV
  useRoute("articles/export/csv")
    .get("/")
    .code(200)                 // Success: CSV file
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Export articles to CSV")
    .tags(["Articles", "Export"])
    .auth("bearer")
    .guard(JWTGuard({ guardName: "adminOnly" }))
    .binary()
    .responseHeader(
      "Content-Disposition",
      'attachment; filename="articles-export.csv"',
      200
    )
    .handler(async () => service.exportArticlesToCsv())
    .build();

  /* Кастомные guard'ы и примеры ─────────────────────────────── */

  // Example of custom guard (admin role check)
  useRoute("articles/admin-only")
    .get("/")
    .code(200, Type.Object({ secret: Type.String() }))  // Success: Admin data
    .code(401, ErrorSchema)    // Error: Unauthorized
    .code(403, Type.Object({ error: Type.String() }))    // Error: Forbidden
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Admin only (custom guard)")
    .tags(["Articles", "Admin"])
    .auth("bearer")
    .guard(async function (req, reply) {
      if (!req.headers.authorization) {
        return { status: 401, data: { error: "Unauthorized" } };
      }
      if (req.headers["x-admin-role"] !== "superadmin") {
        return { status: 403, data: { error: "Forbidden" } };
      }
      return true;
    })
    .handler(() => ({
      status: 200,
      data: { secret: "42" }
    }))
    .build();

  // Example of text response
  useRoute("articles/ping")
    .get("/")
    .code(200)                 // Success: Text response
    .code(500, ErrorSchema)    // Error: Server error
    .summary("Service health check")
    .tags(["Articles"])
    .text()
    .responseHeader("X-Service-Ping", "ok", 200)
    .handler(() => "pong")
    .build();
}
```