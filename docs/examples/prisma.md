# Prisma Extension
TSDIAPI extends Prisma's capabilities using [PrismaQL CLI](https://github.com/unbywyd/prismaql-cli) and its core engine [PrismaQL](https://github.com/unbywyd/prismaql). This powerful combination allows for advanced schema management through a SQL-like DSL.


## 1. Creating enums
```bash
prismaql "ADD ENUM Role ({ADMIN|USER|MODERATOR|GUEST});"
prismaql "ADD ENUM MediaType ({IMAGE|VIDEO|DOCUMENT|AUDIO|ARCHIVE});"
```

## 2. Updating generator (changing output path)
```bash
prismaql "UPDATE GENERATOR client (output='../generated/prisma-client');"
```

## 3. Updating DB connection
```bash
prismaql "UPDATE DB (url='postgresql://user:password@localhost:5432/mydb', provider='postgresql');"
```

## 4. Creating models
```bash
prismaql "ADD MODEL User ({id String @id @default(cuid())|email String @unique|name String?|role Role @default(USER)|createdAt DateTime @default(now())|updatedAt DateTime @updatedAt});"
prismaql "ADD MODEL Profile ({id String @id @default(cuid())|bio String?|avatar String?|userId String});"
prismaql "ADD MODEL Media ({id String @id @default(cuid())|url String|key String|type MediaType|width Int?|height Int?|size Float?|ownerId String});"
prismaql "ADD MODEL Post ({id String @id @default(cuid())|title String|content String|published Boolean @default(false)|authorId String});"
prismaql "ADD MODEL Category ({id String @id @default(cuid())|name String @unique|description String?});"
```

## 5. Adding fields to existing models
```bash
prismaql "ADD FIELD password TO User ({String @default('')});"
prismaql "ADD FIELD isVerified TO User ({Boolean @default(false)});"
prismaql "ADD FIELD tags TO Post ({String[]});"
```

## 6. Creating relations between models
### 1:1 relation User-Profile
```bash
prismaql "ADD RELATION User AND Profile (type=1:1, fkHolder=Profile, relationName=userProfile);"
```

### 1:M relation User-Post
```bash
prismaql "ADD RELATION User AND Post (type=1:M, fkHolder=Post, relationName=userPosts);"
```

### M:M relation Post-Category via pivot table
```bash
prismaql "ADD RELATION Post AND Category (type=M:N, pivotTable=PostsOnCategories);"
```

### 1:M relation User-Media
```bash
prismaql "ADD RELATION User AND Media (type=1:M, fkHolder=Media, relationName=userMedia);"
```

## 7. Updating existing models
```bash
prismaql "UPDATE FIELD email IN User ({String @unique @db.VarChar(255)});"
prismaql "UPDATE FIELD role IN User ({Role @default(GUEST)});"
```

## 8. Updating enum (adding new values)
```bash
prismaql "UPDATE ENUM Role ({ADMIN|USER|MODERATOR|GUEST|SUPER_ADMIN}) (replace=true);"
```

## 9. Adding a new generator
```bash
prismaql "ADD GENERATOR typegen ({provider='prisma-client-js', output='../generated/prisma-types'});"
```

## 10. Deleting a field (example)
```bash
prismaql "DELETE FIELD isVerified IN User;"
```

## 11. Deleting a relation (example)
```bash
prismaql "DELETE RELATION User, Media (relationName=userMedia);"
```

## 12. Validating the schema
```bash
prismaql "VALIDATE;"
```

## 13. Viewing all models (query)
```bash
prismaql "GET MODELS;"
```

## 14. Viewing a specific model (query)
```bash
prismaql "GET MODEL User;"
```

## 15. Chaining commands in one call
```bash
prismaql "ADD MODEL Temp ({id Int @id @default(autoincrement())|value String}); ADD FIELD tempField TO Temp ({Int}); DELETE MODEL Temp;"
```