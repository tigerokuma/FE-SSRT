# API Configuration Guide

This application supports both local and remote API endpoints. Here's how to configure them:

## Current Configuration

The application is currently configured to use the **remote API** at `34.94.83.163:3000` by default.

## Switching Between Endpoints

### Option 1: Environment Variables (Recommended)

Set the `NEXT_PUBLIC_API_BASE_URL` environment variable:

**For Remote API (default):**
```bash
export NEXT_PUBLIC_API_BASE_URL=http://34.94.83.163:3000
```

**For Local API:**
```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Option 2: Direct Configuration

Edit the `next.config.mjs` file and change the default URL:

```javascript
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://YOUR_PREFERRED_ENDPOINT:3000'
```

## Available Endpoints

1. **Remote API**: `http://34.94.83.163:3000`
   - Use when connecting to the deployed backend
   - Default configuration

2. **Local API**: `http://localhost:3000`  
   - Use when running the backend locally
   - Requires backend server to be running locally

## How It Works

The application uses Next.js API rewrites to proxy requests:
- Frontend requests go to `/api/backend/*` 
- Next.js rewrites them to `{API_BASE_URL}/*`
- This allows seamless switching between endpoints without changing frontend code

## Verifying Configuration

1. Start the Next.js development server: `npm run dev`
2. Open browser developer tools
3. Check the Network tab when making API requests
4. Requests should be proxied to your configured endpoint

## Troubleshooting

- If you get CORS errors, ensure the backend is configured to allow requests from your frontend domain
- If you get connection errors, verify the API endpoint is accessible and running
- Check that the API server is running on the expected port (3000) 