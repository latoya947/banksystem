# Bank3 Deployment Guide

## Step 1: New Supabase Setup

1. **Create new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run database setup:**
   - Copy and paste `scripts/000_complete_database_setup.sql` into Supabase SQL editor
   - Run the script

3. **Create admin user:**
   - Register a user account through your app
   - Update `scripts/001_create_admin_user.sql` with your email
   - Run the script in Supabase SQL editor

## Step 2: Update Environment Variables

Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key
NEXT_PUBLIC_VAT_CODE=VAT123
NEXT_PUBLIC_COT_CODE=COT456
```

## Step 3: Hosting Options

### Option A: Vercel (Recommended)
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option B: Namecheap Hosting
1. Build the app: `npm run build`
2. Upload to Namecheap hosting
3. Configure Node.js environment
4. Set environment variables

## Step 4: Domain Configuration

### If using Vercel:
1. In Vercel dashboard, go to your project settings
2. Add your Namecheap domain
3. Update DNS in Namecheap:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → Vercel IP (provided by Vercel)

### If using Namecheap hosting:
1. Point your domain to Namecheap hosting
2. Configure subdomain if needed

## Step 5: Test Everything

1. **Test user registration**
2. **Test admin login** (should redirect to admin panel)
3. **Test pending transactions** (withdraw > $1000)
4. **Test admin approval/rejection**

## Troubleshooting

- **Admin not working:** Check user metadata in Supabase Auth
- **Pending transactions not showing:** Check RLS policies
- **Build errors:** Check environment variables
- **Domain not working:** Check DNS propagation (can take 24-48 hours)

