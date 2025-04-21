# Production Setup Guide

## 🚀 Basic Setup

1. Build the project:
   ```bash
   npm run build
   ```

2. Start in production mode:
   ```bash
   npm run start
   ```

## 🔧 PM2 Configuration

Since TSDIAPI uses ESM modules, use this command to start with PM2:

```bash
pm2 start npm --name <app-name> -- run start
```

Example:
```bash
pm2 start npm --name my-api -- run start
```

## ⚙️ Environment Configuration

1. Create `.env` file in the project root:
   ```env
   NODE_ENV=production
   PORT=3000
   # Add other environment variables
   ```

2. Make sure all required environment variables are set in production.

## 📦 Additional PM2 Commands

```bash
# View logs
pm2 logs <app-name>

# Restart application
pm2 restart <app-name>

# Stop application
pm2 stop <app-name>

# Delete application
pm2 delete <app-name>
```

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/) 