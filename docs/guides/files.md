# File Handling Guide

This guide explains how to handle file uploads and processing in TSDIAPI.

## 🚀 Basic File Upload

TSDIAPI provides robust file handling capabilities through the `@fastify/multipart` plugin. Here's a basic example:

```typescript
export default function uploadController({ useRoute }: AppContext) {
  useRoute()
    .post("/upload")
    .acceptMultipart()
    .body(Type.Object({
      file: Type.String({ format: "binary" }),
      metadata: Type.Object({
        title: Type.String()
      })
    }))
    .fileOptions({
      maxFileSize: 1024 * 1024 * 5, // 5MB
      accept: ["image/jpeg", "image/png"]
    }, "file")
    .handler(async (req) => {
      // Files are available in req.tempFiles
      const file = req.tempFiles[0];
      return { status: 200, data: { url: file.url } };
    })
    .build();
}
```

## 📦 File Storage and Processing

### 1. Temporary Storage
- Files are stored in memory as `Buffer` objects
- Accessible through `req.tempFiles` array in route handlers
- Each file has a unique ID and metadata

### 2. File Object Structure
```typescript
interface UploadFile {
    id: string;              // Unique identifier
    fieldname: string;       // Form field name
    filename: string;        // Original filename
    encoding: string;        // File encoding
    mimetype: string;        // MIME type
    filesize: number;        // File size in bytes
    buffer: Buffer;          // File content
    url?: string;            // URL after processing
    meta?: Record<string, any>; // Custom metadata
    s3bucket?: string;       // S3 bucket if uploaded
    s3region?: string;       // S3 region if uploaded
}
```

### 3. File Processing Options

#### Global File Loader (Recommended)
```typescript
createApp<ConfigType>({
  fileLoader: async (file: UploadFile) => {
    // Example: Upload to S3
    const s3Url = await uploadToS3(file.buffer, {
      bucket: 'my-bucket',
      key: `${file.id}-${file.filename}`
    });
    
    return {
      ...file,
      url: s3Url,
      s3bucket: 'my-bucket',
      s3region: 'us-east-1'
    };
  }
});
```

#### Manual Processing in Handler
```typescript
useRoute()
  .post("/upload")
  .body(Type.Object({
    file: Type.String({ format: "binary" })
  }))
  .acceptMultipart()
  .handler(async (req) => {
    const file = req.tempFiles[0];
    // use import { useS3Provider } from "@tsdiapi/s3";
    const s3provider = useS3Provider();
    // Manual upload
    const upload = await s3provider.uploadToS3({
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.filename
    }, isPrivate);
    
    return { 
      status: 200, 
      data: { 
        url: upload.url,
        filename: upload.key,
      } 
    };
  })
  .build();
```

### 4. File Access in Routes
```typescript
useRoute()
  .post("/process-files")
  .acceptMultipart()
  .handler(async (req) => {
    // Access all uploaded files
    const files = req.tempFiles;
    
    // Process each file
    const results = await Promise.all(
      files.map(async (file) => {
        // File is already processed if global fileLoader is set
        if (file.url) {
          return { url: file.url };
        }
        
        // Manual processing if needed
        const url = await uploadToStorage(file.buffer);
        return { url };
      })
    );
    
    return { status: 200, data: { files: results } };
  })
  .build();
```

## 🔒 Best Practices

### 1. File Validation
```typescript
.fileOptions({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  accept: ["image/*"],          // All image types
  maxFiles: 5                   // Maximum files per request
})
```

### 2. Error Handling
```typescript
useRoute()
  .post("/upload")
  .acceptMultipart()
  .code(400, Type.Object({
    error: Type.String()
  }))
  .handler(async (req) => {
    if (!req.tempFiles?.length) {
      return { 
        status: 400, 
        data: { error: "No files uploaded" } 
      };
    }
    // Process files...
  })
  .build();
```

### 3. Security Considerations
1. **File Size Limits**: Both global and per-route limits prevent DoS attacks
2. **MIME Type Validation**: Ensures only allowed file types are uploaded
3. **Temporary Storage**: Files are stored in memory and processed immediately
4. **Unique Identifiers**: Each file gets a unique ID to prevent conflicts

## 📚 Additional Resources

- [Fastify Multipart Documentation](https://github.com/fastify/fastify-multipart)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html) 