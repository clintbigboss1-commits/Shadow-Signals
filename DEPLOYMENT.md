# Shadow-Signals Deployment Guide

This guide covers deploying Shadow-Signals with:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (Node.js/Express)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend

## Prerequisites

- Vercel account
- Railway account
- Supabase account
- Resend account

---

## 1. Supabase Setup (Database)

### Create Database
1. Go to https://supabase.com and create a new project
2. Get your credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (PostgreSQL connection string)

### Initialize Database Schema
```bash
# Run migrations or init scripts
npm run db:init
```

---

## 2. Resend Setup (Email Service)

### Create Resend Account
1. Sign up at https://resend.com
2. Get your `RESEND_API_KEY`
3. Verify your domain (optional but recommended)

### Update Email Configuration
Update `server/config/email.js` or wherever emails are sent:
```javascript
const resend = new Resend(process.env.RESEND_API_KEY);

// Send email example
await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome to Shadow-Signals',
  html: '<h1>Welcome!</h1>'
});
```

---

## 3. Railway Setup (Backend)

### Deploy Backend
1. Go to https://railway.app and sign in
2. Create a new project
3. Connect your GitHub repository
4. Configure environment variables in Railway dashboard:
   ```
   DATABASE_URL=<from Supabase>
   SUPABASE_URL=<from Supabase>
   SUPABASE_ANON_KEY=<from Supabase>
   SUPABASE_SERVICE_ROLE_KEY=<from Supabase>
   RESEND_API_KEY=<from Resend>
   JWT_SECRET=<generate a secure key>
   NODE_ENV=production
   ```

5. Set the start command:
   ```
   node server/index.js
   ```

6. Deploy and note your API URL (e.g., `https://shadow-signals-api.railway.app`)

---

## 4. Vercel Setup (Frontend)

### Deploy Frontend
1. Go to https://vercel.com and sign in
2. Import your GitHub repository
3. Select `shadow-signals/client` as the root directory
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://shadow-signals-api.railway.app
   ```

5. Deploy

---

## 5. GitHub Actions CI/CD Setup

### Add Secrets to GitHub
Go to **Settings → Secrets and variables → Actions** and add:

**Vercel:**
- `VERCEL_TOKEN` - From Vercel account settings
- `VERCEL_ORG_ID` - Your Vercel org ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

**Railway:**
- `RAILWAY_TOKEN` - From Railway account settings

### Auto-Deploy
Pushes to `main` branch automatically trigger deployment.

---

## 6. Database Migrations

### Running Migrations
```bash
# Initialize database
npm run db:init

# Stripe setup (if applicable)
npm run stripe:setup
```

---

## Troubleshooting

### Frontend not connecting to backend
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Verify CORS settings in Express backend
- Check Railway service is running

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check Supabase firewall settings
- Ensure IP is whitelisted on Railway/Supabase

### Email not sending
- Verify `RESEND_API_KEY` is correct
- Check sender email domain
- Review Resend logs for errors

---

## Production Checklist

- [ ] Database backups enabled in Supabase
- [ ] SSL certificates configured
- [ ] Environment variables set in all platforms
- [ ] Monitoring/logging configured
- [ ] Error tracking (Sentry, etc.) set up
- [ ] Rate limiting enabled on Railway
- [ ] CORS properly configured
- [ ] API keys rotated

---

## Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Resend Docs](https://resend.com/docs)
