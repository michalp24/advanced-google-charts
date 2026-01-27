# Deployment Guide

This guide covers deploying Advanced Google Charts to various platforms.

## Table of Contents

- [Vercel (Recommended)](#vercel-recommended)
- [Netlify](#netlify)
- [Self-Hosted (Docker)](#self-hosted-docker)
- [Traditional Node.js Server](#traditional-nodejs-server)

---

## Vercel (Recommended)

Vercel is the easiest and recommended way to deploy Next.js applications.

### Option 1: Deploy via Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Done!** Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd "Advanced Google Charts"
   vercel
   ```

4. **For production**:
   ```bash
   vercel --prod
   ```

### Custom Domain on Vercel

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificate

### Environment Variables (V2+)

For future versions that require environment variables:

1. In Vercel dashboard → Settings → Environment Variables
2. Add variables for:
   - Production
   - Preview
   - Development

---

## Netlify

### Option 1: Deploy via Netlify Dashboard

1. **Push to GitHub** (same as Vercel)

2. **Import to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Netlify Configuration

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## Self-Hosted (Docker)

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Update next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

### Build and Run

```bash
# Build Docker image
docker build -t advanced-google-charts .

# Run container
docker run -p 3000:3000 advanced-google-charts
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Run with:
```bash
docker-compose up -d
```

---

## Traditional Node.js Server

### Build for Production

```bash
npm run build
```

### Run Production Server

```bash
npm start
```

The app will be available at `http://localhost:3000`.

### Using PM2 (Process Manager)

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2**:
   ```bash
   pm2 start npm --name "advanced-google-charts" -- start
   ```

3. **Save PM2 configuration**:
   ```bash
   pm2 save
   ```

4. **Auto-start on reboot**:
   ```bash
   pm2 startup
   ```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/advanced-google-charts`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/advanced-google-charts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Performance Optimization

### Enable Caching

In `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
};
```

### CDN Integration

For static assets, consider using a CDN:

1. **Vercel** - Built-in global CDN
2. **Cloudflare** - Add as DNS proxy
3. **AWS CloudFront** - For S3-hosted static files

### Image Optimization

Since this app doesn't use images heavily, the default Next.js image optimization is sufficient.

---

## Monitoring & Analytics

### Vercel Analytics

Add to your app:

```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Custom Analytics

You can integrate:
- Google Analytics
- Plausible Analytics
- Fathom Analytics
- PostHog

---

## Troubleshooting Deployment

### Build Errors

**Error: Out of memory**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Runtime Errors

**Error: 404 on API routes**
- Ensure you're using App Router (not Pages Router)
- Check that all routes are in the `app/` directory

**Error: Hydration mismatch**
- Ensure server and client render the same content
- Check for browser-only APIs used during SSR

### Performance Issues

**Slow initial load**
- Enable output: 'standalone' in next.config.ts
- Use Docker for smaller image size
- Enable compression

**Slow page transitions**
- Implement route prefetching
- Optimize bundle size

---

## Post-Deployment Checklist

- [ ] Test all features in production
- [ ] Verify responsive design on mobile
- [ ] Test embed generation and copying
- [ ] Test standalone embed URL
- [ ] Check animation performance
- [ ] Verify SSL certificate (HTTPS)
- [ ] Set up custom domain (optional)
- [ ] Configure CDN (optional)
- [ ] Set up monitoring/analytics (optional)
- [ ] Test with real Google Sheets charts
- [ ] Check cross-browser compatibility
- [ ] Verify accessibility (screen readers, keyboard nav)

---

## Scaling Considerations

### For V1 (Current)

Since V1 is fully client-side:
- No database to scale
- No backend to scale
- Static hosting is sufficient
- CDN handles global distribution

### For V2+ (Future)

When adding backend features:
- Consider serverless functions (Vercel Functions)
- Add database (Vercel Postgres, Supabase)
- Implement caching (Redis)
- Use queue for heavy operations (BullMQ)

---

## Security Best Practices

1. **HTTPS Only**: Always use SSL/TLS
2. **Content Security Policy**: Add CSP headers
3. **Rate Limiting**: Implement for API routes (V2+)
4. **Input Validation**: Already using Zod schemas
5. **Dependency Updates**: Run `npm audit` regularly

---

## Backup & Disaster Recovery

Since V1 is stateless:
- Keep code in version control (Git)
- Tag releases for rollback capability
- Document configuration
- Keep build artifacts for quick rollback

For V2+ with database:
- Set up automated database backups
- Document restore procedures
- Test disaster recovery plan

---

## Support & Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Docker Documentation](https://docs.docker.com/)

---

**Happy Deploying! 🚀**
