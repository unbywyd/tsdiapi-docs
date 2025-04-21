# Modules

Modules in TSDIAPI are feature-based units that combine routing, services, and business logic. They help organize your application into cohesive, maintainable pieces.

## Module Structure

A typical feature module structure:

```
api/features/users/
├── users.module.ts
├── users.service.ts
└── users.types.ts
```

## Module Implementation

Here's how to implement a feature module:

```typescript
// users.types.ts
import { Type } from "@sinclair/typebox";

export const UserSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String({ format: "email" })
});

export type User = Static<typeof UserSchema>;

// users.service.ts
import { Service } from "typedi";
import { PrismaClient } from "@prisma/client";
import type { User } from "./users.types.js";

@Service()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async getUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}

// users.module.ts
import { Container } from "typedi";
import { UsersService } from "./users.service.js";
import { UserSchema } from "./users.types.js";

export default function UsersModule({ useRoute }: AppContext) {
  const route = useRoute("/users");
  const usersService = Container.get(UsersService);

  route
    .get("/")
    .response(Type.Array(UserSchema))
    .handler(async () => {
      return usersService.getUsers();
    })
    .build();
}
```

## Module Features

### Route Base Path

Modules can define a base path for all routes:

```typescript
export default function AuthModule({ useRoute }: AppContext) {
  const route = useRoute("/auth"); // All routes will be prefixed with /auth
  
  route.post("/login").handler(handler).build();    // /auth/login
  route.post("/register").handler(handler).build(); // /auth/register
  route.post("/logout").handler(handler).build();   // /auth/logout
}
```

### Service Integration

Modules work with services through dependency injection:

```typescript
export default function ProductModule({ useRoute }: AppContext) {
  const route = useRoute("/products");
  const productService = Container.get(ProductService);
  const categoryService = Container.get(CategoryService);

  // Use multiple services in your routes
}
```

### Type Integration

Use TypeBox for request/response typing:

```typescript
const ProductSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  price: Type.Number()
});

export default function ProductModule({ useRoute }: AppContext) {
  route
    .post("/products")
    .body(Type.Omit(ProductSchema, ["id"]))
    .response(ProductSchema)
    .handler(async ({ body }) => {
      return productService.createProduct(body);
    })
    .build();
}
```

## Best Practices

1. **Module Organization**
   - One feature per module
   - Keep related functionality together
   - Use clear, descriptive names

2. **File Structure**
   - Separate types, services, and module
   - Use consistent naming
   - Keep files focused

3. **Code Organization**
   - Group related routes
   - Use service layer for business logic
   - Keep modules clean and simple

4. **Type Safety**
   - Define clear types/schemas
   - Use TypeBox for validation
   - Share types between files

## Complete Example

Here's a complete feature module example:

```typescript
// posts.types.ts
import { Type } from "@sinclair/typebox";

export const PostSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  content: Type.String(),
  authorId: Type.String(),
  createdAt: Type.String({ format: "date-time" })
});

export const CreatePostSchema = Type.Omit(PostSchema, ["id", "createdAt"]);
export const UpdatePostSchema = Type.Partial(CreatePostSchema);

export type Post = Static<typeof PostSchema>;
export type CreatePost = Static<typeof CreatePostSchema>;
export type UpdatePost = Static<typeof UpdatePostSchema>;

// posts.service.ts
import { Service } from "typedi";
import { PrismaClient } from "@prisma/client";
import type { Post, CreatePost, UpdatePost } from "./posts.types.js";

@Service()
export class PostsService {
  constructor(
    private prisma: PrismaClient,
    private userService: UserService
  ) {}

  async getPosts(): Promise<Post[]> {
    return this.prisma.post.findMany();
  }

  async getPost(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      throw new Error("Post not found");
    }

    return post;
  }

  async createPost(data: CreatePost): Promise<Post> {
    // Verify author exists
    await this.userService.getUser(data.authorId);

    return this.prisma.post.create({
      data: {
        ...data,
        createdAt: new Date().toISOString()
      }
    });
  }

  async updatePost(id: string, data: UpdatePost): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data
    });
  }

  async deletePost(id: string): Promise<void> {
    await this.prisma.post.delete({
      where: { id }
    });
  }
}

// posts.module.ts
import { Container } from "typedi";
import { PostsService } from "./posts.service.js";
import {
  PostSchema,
  CreatePostSchema,
  UpdatePostSchema
} from "./posts.types.js";

export default function PostsModule({ useRoute }: AppContext) {
  const route = useRoute("/posts");
  const postsService = Container.get(PostsService);

  // GET /posts
  route
    .get("/")
    .response(Type.Array(PostSchema))
    .handler(async () => {
      return postsService.getPosts();
    })
    .build();

  // GET /posts/:id
  route
    .get("/:id")
    .response(PostSchema)
    .handler(async ({ params }) => {
      return postsService.getPost(params.id);
    })
    .build();

  // POST /posts
  route
    .post("/")
    .body(CreatePostSchema)
    .response(PostSchema)
    .handler(async ({ body }) => {
      return postsService.createPost(body);
    })
    .build();

  // PUT /posts/:id
  route
    .put("/:id")
    .body(UpdatePostSchema)
    .response(PostSchema)
    .handler(async ({ params, body }) => {
      return postsService.updatePost(params.id, body);
    })
    .build();

  // DELETE /posts/:id
  route
    .delete("/:id")
    .handler(async ({ params }) => {
      await postsService.deletePost(params.id);
      return { success: true };
    })
    .build();
}
``` 