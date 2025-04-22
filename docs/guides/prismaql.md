# PrismaQL CLI - Mutation Commands Documentation
TSDIAPI extends Prisma's capabilities using [PrismaQL CLI](https://github.com/unbywyd/prismaql-cli) and its core engine [PrismaQL](https://github.com/unbywyd/prismaql). This powerful combination allows for advanced schema management through a SQL-like DSL.



## Introduction
PrismaQL CLI is a command-line tool that leverages the PrismaQL Core engine to manage and edit Prisma schemas via a SQL-like DSL. It allows you to execute query and mutation commands directly in your terminal, enabling everything from listing models to creating complex relations.

### Key Advantages:
- **Declarative Command Syntax** – Intuitive and human-readable commands like GET MODELS, ADD FIELD, and more.
- **Query & Mutation Separation** – Clear distinction between read-only operations (GET, PRINT, VALIDATE) and modifying ones (ADD, DELETE, UPDATE).
- **Configurable Workflow** – Easily extend and integrate custom handlers for queries and mutations.
- **Safe & Reversible Edits** – Built-in validation with automatic backups to ensure data integrity.
- **Flexible Relation Management** – Supports 1:1, 1:M, and M:N relationships, including pivot table-based relations. Allows both direct and indirect (foreign-key-only) associations, with the ability to choose the FK holder side for precise schema control.

## How It Works
- **Parsing DSL** – Raw text commands (e.g. GET MODEL User;) go through the PrismaQlDslParser, producing a structured object.
- **Chained Commands** – You can chain multiple commands in a single line, separated by semicolons, and they will be executed sequentially.
- **Validation & Execution** – Queries simply inspect the schema; mutations modify it, ensuring AST-level integrity.
- **Backup & Save** – Each mutation can undergo a dry run, then save changes. Old versions are stored in .prisma/backups.
- **Extensible Handlers** – You can register query or mutation handlers to shape how commands are processed.

 
## Command Pattern
A command typically follows this structure:

- **ACTION COMMAND ...args (\{PRISMA_BLOCK\}) (OPTIONS);**
  - **ACTION** – One of GET, PRINT, VALIDATE, ADD, DELETE, UPDATE.
  - **COMMAND** – A specific target (e.g., MODEL, RELATION, ENUM, GENERATORS, GENERATOR).
  - **ARGS** – Varies by command (e.g., User, User,Post, fieldName).
  - **PRISMA_BLOCK** – An optional Prisma snippet in (\{ ... \}) format, used for model/field definitions.
  - **OPTIONS** – Additional parameters in (key=value, flag, ...) format.

## Basic Usage
```bash
prismaql <command> [--dry]
```
- **\<command\>** – A PrismaQL DSL command like GET MODELS;, ADD FIELD name TO User (\{String\});, etc.
- **--dry** – (Optional) Performs a dry run without applying any changes to the schema.

## Mutation Commands (WRITE OPERATIONS)

### ADD MODEL \<name\> (\{...\})
- **Description**: Creates a new model. Requires two parameters: name and a Prisma block with fields.
- **Example**:
  ```bash
  prismaql "ADD MODEL User ({ id Int @id @default(autoincrement()) | name String });"
  ```
- **Result**: Model User added with fields: id, name

### ADD FIELD \<name\> TO \<model\> (\{String\})
- **Description**: Adds a new field to a model. Requires the field name, the model name, and a Prisma block describing field attributes.
- **Example**:
  ```bash
  prismaql "ADD FIELD email TO User ({String @unique});"
  ```
- **Result**: Field email added to model User

### ADD RELATION \<modelA\> AND \<modelB\> (...options)
- **Description**: Creates a relation between two models. Supports multiple options:
  - **type (required)**: Defines the relation type: "1:1" | "1:M" | "M:N".
  - **pivotTable (optional)**: string | true. If true, a pivot table is created automatically. In 1:1 or 1:M, it can create an intermediate table.
  - **fkHolder (optional)**: Specifies which model holds the foreign key.
  - **required (optional)**: Marks the relation as required (true) or optional (false). Defaults to true.
  - **relationName (optional)**: Custom relation name. If omitted, a name is generated.
- **Example**:
  ```bash
  prismaql "ADD RELATION User TO Profile (type=1:1, pivotTable=true, fkHolder=User, required=false, relationName=UserProfile);"
  ```
- **Result**: Relation UserProfile added between User and Profile

### ADD ENUM \<name\> (\{A|B|C\})
- **Description**: Creates a new enum. The block can include values separated by |.
- **Example**:
  ```bash
  prismaql "ADD ENUM Role ({ADMIN|USER|SUPERUSER});"
  ```
- **Result**: Enum Role added with values: ADMIN, USER, SUPERUSER

### DELETE MODEL \<name\>
- **Description**: Removes a model by name.
- **Example**:
  ```bash
  prismaql "DELETE MODEL TempData;"
  ```
- **Result**: Model TempData deleted

### DELETE FIELD \<name\> IN \<model\>
- **Description**: Removes a specific field from a model.
- **Example**:
  ```bash
  prismaql "DELETE FIELD email IN User;"
  ```
- **Result**: Field email deleted from model User

### DELETE RELATION \<modelA\>, \<modelB\> (...options)
- **Description**: Unlinks relations between two models. If no options are passed, all relations between them are removed.
  - **fieldA (optional)**: Field name on Model A.
  - **fieldB (optional)**: Field name on Model B.
  - **relationName (optional)**: If a relation was named via @relation("myRel"), specify it here.
- **Example**:
  ```bash
  prismaql "DELETE RELATION User, Post (fieldA=userId, fieldB=authorId, relationName=UserPosts);"
  ```
- **Result**: Relation UserPosts deleted between User and Post

### DELETE ENUM \<name\>
- **Description**: Removes an existing enum.
- **Example**:
  ```bash
  prismaql "DELETE ENUM Role;"
  ```
- **Result**: Enum Role deleted

### UPDATE FIELD \<name\> IN \<model\> (\{...\})
- **Description**: Recreates the specified field in a model, which can break migrations if used carelessly.
- **Example**:
  ```bash
  prismaql "UPDATE FIELD email IN User ({String @unique @db.VarChar(255)});"
  ```
- **Result**: Field email updated in model User

### UPDATE ENUM \<name\> (\{A|B\})(replace?)
- **Description**: Updates an enum. By default, new values are appended; with replace=true, the existing enum is replaced.
- **Example**:
  ```bash
  prismaql "UPDATE ENUM Role ({ADMIN|SUPERADMIN}) (replace=true);"
  ```
- **Result**: Enum Role updated with values: ADMIN, SUPERADMIN

### UPDATE DB (url='...', provider='...')
- **Description**: Updates the database connection URL and provider.
- **Example**:
  ```bash
  prismaql "UPDATE DB (url='mysql://user:password@localhost:3306/db', provider='mysql');"
  ```
- **Result**: Database updated to provider: mysql, URL: mysql://user:password@localhost:3306/db

### UPDATE GENERATOR \<name\> (\{...\})(provider='...', output='...')
- **Description**: Updates a generator with new options.
- **Example**:
  ```bash
  prismaql "UPDATE GENERATOR client ({provider='prisma-client-js', output='@prisma/client'});"
  ```
- **Result**: Generator client updated with provider: prisma-client-js, output: @prisma/client

### ADD GENERATOR \<name\> (\{...\})
- **Description**: Adds a new generator to the schema.
- **Example**:
  ```bash
  prismaql "ADD GENERATOR client ({provider='', output=''});"
  ```
- **Result**: Generator client added

### DELETE GENERATOR \<name\>
- **Description**: Removes a generator from the schema.
- **Example**:
  ```bash
  prismaql "DELETE GENERATOR client;"
  ```
- **Result**: Generator client deleted

## Dry Run and Confirmation
- **--dry** – When you append this flag, the command simulates changes but does not modify the schema. This is useful for verifying correctness.
- **Confirmation Hooks** – If you integrate the CLI with a script, you can prompt users for confirmation after seeing the changes (the CLI provides a confirmation mechanism in interactive scenarios).

## Backup and Restore
By default, whenever the CLI applies a mutation, it stores the previous schema version under .prisma/backups. This helps to:

- Rollback if something breaks.
- Track incremental changes over time.


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