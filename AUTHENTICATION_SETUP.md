# Authentication Setup Guide

This application includes password protection to secure access to the Masonry Optimizer.

## How Authentication Works

- All routes are protected by default and require login
- Users must authenticate with a username and password
- Session is maintained via secure HTTP-only cookies (7 day expiration)
- Login page is available at `/login`

## Setting Up Authentication

### For Vercel Deployment

1. Go to your Vercel project dashboard: https://vercel.com/henrylads/masonry-optimizer-hc
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

   | Variable Name    | Value                          | Description                    |
   |------------------|--------------------------------|--------------------------------|
   | `AUTH_USERNAME`  | Your desired username          | Username for login access      |
   | `AUTH_PASSWORD`  | Your secure password           | Password for login access      |

4. Click **Save** and redeploy the application

### For Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set your credentials:
   ```env
   AUTH_USERNAME=your-username
   AUTH_PASSWORD=your-secure-password
   ```

3. Restart the development server

## Default Credentials

⚠️ **SECURITY WARNING**: The default credentials are:
- Username: `admin`
- Password: `password123`

**You MUST change these immediately in production!**

## Bypassing Authentication (Development Only)

To disable authentication for local development:

Add to your `.env.local`:
```env
BYPASS_AUTH=true
```

⚠️ **Never set `BYPASS_AUTH=true` in production environments!**

## Testing Authentication

1. Visit your application URL
2. You should be automatically redirected to `/login`
3. Enter your credentials
4. Upon successful login, you'll be redirected to the home page
5. The session will persist for 7 days

## Security Recommendations

1. **Use a strong password**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Never commit `.env.local`**: This file is already in `.gitignore`
3. **Rotate credentials regularly**: Update passwords every 90 days
4. **Use environment-specific credentials**: Different passwords for staging vs production
5. **Monitor access logs**: Check Vercel deployment logs for suspicious activity

## Troubleshooting

### "Invalid credentials" error
- Double-check your environment variables in Vercel dashboard
- Ensure there are no extra spaces in the variable values
- Redeploy after changing environment variables

### Stuck in redirect loop
- Clear your browser cookies for the site
- Check that `BYPASS_AUTH` is not set to conflicting values

### Authentication not working after deployment
- Verify environment variables are set in Vercel
- Check the deployment logs for any errors
- Try a fresh deployment after setting variables
