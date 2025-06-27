# Frontend Environment Setup

## Environment Variables

Để cấu hình API URL cho different environments:

### Development (.env.local)
```
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=Medical SWP
VITE_NODE_ENV=development
```

### Production (Render Environment Variables)
```
VITE_API_URL=https://your-backend-service.onrender.com/api
VITE_APP_NAME=Medical SWP  
VITE_NODE_ENV=production
```

## Build Commands

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run preview
```

## Render Deployment

1. Set environment variables in Render dashboard
2. Build command: `npm run build`
3. Publish directory: `dist` 