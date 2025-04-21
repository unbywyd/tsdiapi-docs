# Installation

## System Requirements

Before installing TSDIAPI, ensure your system meets these requirements:

- Node.js version 16 or higher
- npm version 7 or higher
- TypeScript 4.x or higher

## Quick Start with npx

The fastest way to get started with TSDIAPI is using npx:

```bash
npx @tsdiapi/cli create myapi
cd myapi
npm start
```

## Global CLI Installation

Install TSDIAPI CLI globally to access it from anywhere:

```bash
npm install -g @tsdiapi/cli
```

After installation, verify the CLI is available:

```bash
tsdiapi --version
tsdiapi --help
```

## Creating a New Project

### Interactive Setup (Recommended)

Create a new project with interactive setup:

```bash
tsdiapi init my-api
cd my-api
npm install
```

### Quick Setup

For a quick setup that skips prompts:

```bash
tsdiapi create my-api
cd my-api
npm install
```

## Project Dependencies

TSDIAPI automatically installs these core dependencies:

```json
{
  "dependencies": {
    "@tsdiapi/server": "latest",
    "@sinclair/typebox": "latest",
    "fastify": "latest",
    "typedi": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "nodemon": "^3.0.0",
    "@types/node": "^20.0.0"
  }
}
```

## Verifying Installation

1. Start the development server:
```bash
npm run dev
```

2. Check the API endpoint in your browser:
- `http://localhost:3000` - API root

## Troubleshooting

### Permission Errors During Global Installation

If you encounter EACCES errors:

```bash
# Option 1: Use sudo (Linux/macOS)
sudo npm install -g @tsdiapi/cli

# Option 2: Use --unsafe-perm
npm install -g @tsdiapi/cli --unsafe-perm
```

### Node.js Version Management

Use nvm to manage Node.js versions:

```bash
nvm install 16
nvm use 16
```

### npm Cache Issues

Clear npm cache if you experience package-related issues:

```bash
npm cache clean --force
```

## Configuration

TSDIAPI uses environment variables for configuration. Create a `.env` file in your project root:

```env
PORT=3000
HOST=localhost
```

Access configuration in your code:

```typescript
const port = context.projectConfig.get("PORT", 3000);
const host = context.projectConfig.get("HOST", "localhost");
```

## Next Steps

1. [Quick Start Guide](quick-start)
2. [Project Structure](project-structure)
3. [Creating Your First API](../core/routing) 