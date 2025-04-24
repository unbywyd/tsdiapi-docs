# Code Example

```typescript

// ✅ Import framework utilities and helpers
import {
  DateString,
  AppContext,
  useResponseSchemas,
  ResponseBadRequest,
  ResponseNotFound,
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
// ✅ Import generated TypeBox schemas for Prisma models
// Output<Model>Schema is used for responses
// Input<Model>Schema is used for request bodies
import {
  OutputContactSchema,
  InputContactSchema
} from "@base/api/typebox-schemas/models";

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
        // RULE: Return error object instead of throwing
        return sendError("Contact not found", {
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
    // We can use resolve() for existence check and return error object instead of throwing
    // Resolver can be used for custom validation like a guard and return error object instead of throwing or return data to the handler in req.routeData
    .resolve(async (req) => {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact) {
        return response400("Contact not found");
      }
      return contact;
    })
    .handler(async (req) => {
      try {
        const session = useSession<{ userId: string }>(req);
        const contact = req.routeData;

        // RULE: Always check ownership
        if (contact.userId !== session.userId) {
          return response403("Forbidden");
        }

        await contactService.deleteContact(req.params.id);
        return responseNull();
      } catch (error) {
        // RULE: Check if error is ResponseError, otherwise return 400 error with message
        return error instanceof ResponseError ? error : response400("Failed to delete contact");
      }
    })
    .build();

// ─────────────────────────────────────────────────────────────
// API DEVELOPMENT RULES AND BEST PRACTICES
// ─────────────────────────────────────────────────────────────

/* 1. DATE HANDLING
Always use DateString from @tsdiapi/server for date fields:
Correct: createdAt: DateString()
Incorrect: createdAt: Type.String({ format: "date-time" })
*/

/* 2. FILE HANDLING
Always use Type.String({ format: "binary" }) for file fields:
Correct: file: Type.String({ format: "binary" })
Incorrect: file: Type.String()
- Use .acceptMultipart() for file uploads
- Define fileOptions with size limits and accepted types
- Access files via req.tempFiles
*/

/* 3. RESPONSE CODES
Every route MUST register ALL possible response codes. There are several ways to define response codes:

A. Using individual code() calls:
.code(200, OutputSchema) // Success response
.code(400, ErrorSchema)  // Bad request
.code(401, ErrorSchema)  // Unauthorized
.code(403, ErrorSchema)  // Forbidden
.code(404, ErrorSchema)  // Not found
.code(500, ErrorSchema)  // Internal server error

B. Using codes() with predefined codes object:
const { codes } = useResponseSchemas(OutputSchema, ErrorSchema);
.codes(codes) // Will include all standard codes

or use manual codes
.codes({200: OutputSchema, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema}) 

C. Using response builders:
.code(200, Type.Null()) // For 204 No Content
.code(400, ResponseBadRequest)
.code(403, ResponseForbidden)
.code(404, ResponseNotFound)
.code(500, ResponseInternalServerError)

Rules for response codes:
- Success codes use 200 for all operations (including POST)
- Error codes (400, 401, 403, 404, 500) must be documented
- Each code MUST have a corresponding schema
- All possible error scenarios MUST be documented
- For authenticated routes, 403 response code is REQUIRED
- Use appropriate response builders for common error cases
*/

/* 4. SESSION HANDLING
Session object contains all data from JWT token:
const token = await authProvider.signIn({
  userId: "123",
  role: "admin",
  permissions: ["read", "write"]
});
Access in route handler:
const { userId, role, permissions } = req.session;
For type-safe access, use useSession:
const session = useSession<UserSession>(req);
*/

/* 5. ERROR HANDLING
There are several approaches to error handling in TSDIAPI:

1. Using Response Schemas (Recommended):
const { codes, sendSuccess, sendError } = useResponseSchemas(
    SuccessSchema,
    ErrorSchema
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
            return error instanceof ResponseError ? error : response400("Failed to create contact");
        }
    })
    .build();

2. Using buildExtraResponseCodes (Recommended):
useRoute("contacts")
    .post("/")
    .version('1')
    .codes(buildExtraResponseCodes(ContactSchema, ErrorSchema)) // Registers only 200, 400, 401, 403
    .handler(async (req) => {
        try {
            const contact = await contactService.create(req.body);
            return response200(contact);
        } catch (error) {
            return error instanceof ResponseError ? error : response400("Failed to create contact");
        }
    })
    .build();

3. Service Layer Error Handling:
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

4. Include Error Details:
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
            if (error instanceof ResponseError) {
                return error;
            }
            return sendError(`Invalid input`, {
                errors: [{
                    field: "email",
                    message: "Invalid email format"
                }]
            });
        }
    });

5. Handle Specific Error Types:
try {
    const session = useSession<UserSession>(req);
    const contact = await service.setMainContact(session?.id, req.params.id);
    return { status: 200, data: contact };
} catch (error) {
    if (error instanceof ContactNotFoundError) {
        return { status: 404, data: { error: error.message } };
    }
    if (error instanceof MainContactNotFoundError) {
        return { status: 404, data: { error: error.message } };
    }
    if (error instanceof DatabaseError) {
        return { status: 500, data: { error: error.message } };
    }
    if (error instanceof ValidationError) {
        return { status: 400, data: { error: error.message } };
    }
    if (error instanceof UnauthorizedError) {
        return { status: 401, data: { error: error.message } };
    }
    if (error instanceof ForbiddenError) {
        return { status: 403, data: { error: error.message } };
    }
    return error instanceof ResponseError ? error : response400("Operation failed");
}

6. Handle Async Errors:
try {
    await someAsyncOperation();
} catch (error) {
    return error instanceof ResponseError ? error : response400("Operation failed");
}
*/

/* 6. SERVICE LAYER BEST PRACTICES
- Always wrap database operations in try-catch blocks
- Throw appropriate custom errors
- Handle relationships carefully
- Use TypeDI for dependency injection
- Keep business logic in service layer
- Always validate user ownership before operations
*/

/* 7. CONTROLLER NAMING AND VERSIONING
- use .controller(<controllerName>) for controller name
- Always specify version for each route
- Use semantic versioning (e.g., "1", "2")
- When making breaking changes, increment major version
- Support multiple versions simultaneously
- Each route must be defined separately with single HTTP method
*/

/* 8. FEATURE STRUCTURE
A feature must contain at least:
- name.service.ts (business logic)
- name.module.ts (route definitions)
*/

/* 9. TYPEBOX SCHEMA GENERATION
- Use Output schemas for responses
- Use Input schemas for request bodies
- Import from @base/api/typebox-schemas/models
*/

```
