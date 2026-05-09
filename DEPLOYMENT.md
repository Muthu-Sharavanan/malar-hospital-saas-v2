# Malar Hospital SaaS - Deployment Guide

To make this a fully working website app, follow these 3 simple steps:

## 1. Prepare for Production
Run the build locally to ensure everything is perfect:
```bash
npm run build
```

## 2. Choose a Hosting Provider
- **Vercel (Recommended)**: Best for Next.js. Simply push your code to GitHub and "Import" the project on Vercel.
- **Railway/Render**: Good for PostgreSQL-based apps.

## 3. Database Strategy
Currently, the app uses **PostgreSQL** (Supabase).
- Ensure your `DATABASE_URL` is set correctly in your environment variables.
- Run `npx prisma db push` to sync your schema.

## PWA Support
This app is ready to be installed on your phone or tablet!
1. Open the website in Chrome or Safari.
2. Click the "Share" or "Menu" icon.
3. Select **"Add to Home Screen"**.

Now you can use Malar Hospital SaaS like a native app on your device!
