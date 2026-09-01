# Deployment Guide

## Target Platforms

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Environment Strategy

- Keep application secrets in platform-managed environment variables.
- Validate required environment variables on backend startup.
- Expose only `VITE_` variables to the frontend.

## Backend Deployment Checklist

1. Provide `MONGODB_URI`, JWT secrets, CORS origins, and mail or storage credentials.
2. Build the backend with `npm run build --workspace @x10think/api`.
3. Run the server with `npm run start --workspace @x10think/api`.

## Frontend Deployment Checklist

1. Provide `VITE_API_BASE_URL`.
2. Build the frontend with `npm run build --workspace @x10think/web`.
3. Serve the generated `dist` directory through Vercel.

## Docker Strategy

Docker and Docker Compose should be added when infrastructure orchestration becomes the next active phase. The architecture has been kept compatible with that expansion.
