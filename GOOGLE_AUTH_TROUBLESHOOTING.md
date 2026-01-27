# Google OAuth Callback URI Mismatch - Troubleshooting Summary

## ✅ Completed Verifications

### 1. ✅ Environment Variables Configuration
- **Status**: Added debug logging to verify environment variables are loaded
- **Location**: `src/auth.ts` (lines 21-30)
- **Action Required**: 
  - Ensure `.env` or `.env.local` file exists with:
    ```
    NEXTAUTH_URL=http://localhost:3000
    AUTH_GOOGLE_ID=your-client-id
    AUTH_GOOGLE_SECRET=your-client-secret
    REFLEXION_JWT_SECRET=your-secret-key
    ```
  - **Important**: 
    - No trailing slash on `NEXTAUTH_URL`
    - `REFLEXION_JWT_SECRET` is the primary secret (used for both NextAuth and backend JWT signing)
    - `NEXTAUTH_SECRET` can be used as a fallback for backward compatibility
  - Restart dev server after changing `.env` files

### 2. ✅ NextAuth Configuration
- **Status**: Explicitly set `url` in `authOptions` to ensure proper callback URL construction
- **Location**: `src/auth.ts` (lines 32-34)
- **Callback Path**: `/api/auth/callback/google` (automatically handled by NextAuth)
- **Route Structure**: `/api/auth/[...nextauth]` ✅ Correct

### 3. ✅ Proxy/Header Configuration
- **Status**: Added header configuration to handle proxy scenarios
- **Location**: `next.config.mjs` (lines 28-40)
- **Purpose**: Ensures proper protocol forwarding if behind a proxy

### 4. ✅ Google OAuth Provider Configuration
- **Status**: Verified configuration is correct
- **Location**: `src/auth.ts` (lines 36-45)
- **Configuration**: 
  - Uses `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
  - Includes proper authorization params (consent, offline access)

## 🔍 Manual Verification Steps

### Step 1: Verify Environment Variables
When you start the dev server, you should see debug output like:
```
[AUTH DEBUG] NEXTAUTH_URL: http://localhost:3000
[AUTH DEBUG] AUTH_GOOGLE_ID: Set
[AUTH DEBUG] AUTH_GOOGLE_SECRET: Set
[AUTH DEBUG] REFLEXION_JWT_SECRET: Set
[AUTH DEBUG] NEXTAUTH_SECRET (fallback): Set (or MISSING if not set)
[AUTH DEBUG] Using secret: Set
```

**Important**: `REFLEXION_JWT_SECRET` is the primary secret. If it shows "MISSING", authentication will fail. `NEXTAUTH_SECRET` is only used as a fallback for backward compatibility.

### Step 2: Verify Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure you have:
   - `http://localhost:3000/api/auth/callback/google`
   - **No trailing slash**
   - **Exact match** (case-sensitive)
   - **Protocol must be `http://` for localhost** (not `https://`)

### Step 3: Test the Configuration
1. Start your dev server: `pnpm dev`
2. Navigate to: `http://localhost:3000`
3. Attempt to sign in with Google
4. Check the browser console and server logs for any errors
5. If you see a redirect URI mismatch error, compare:
   - The URI shown in the error message
   - The URI configured in Google Cloud Console
   - The `NEXTAUTH_URL` environment variable

## 🐛 Common Issues & Solutions

### Issue: "redirect_uri_mismatch" Error
**Possible Causes:**
1. **Trailing slash mismatch**: 
   - ❌ `http://localhost:3000/` 
   - ✅ `http://localhost:3000`
2. **Protocol mismatch**: 
   - ❌ `https://localhost:3000` (for local dev)
   - ✅ `http://localhost:3000`
3. **Path mismatch**: 
   - ❌ `http://localhost:3000/auth/callback/google`
   - ✅ `http://localhost:3000/api/auth/callback/google`
4. **Environment variable not loaded**: Restart dev server after changing `.env`

### Issue: Environment Variables Not Loading
**Solutions:**
- Ensure file is named `.env` or `.env.local` (not `.env.example`)
- File should be in the project root (same directory as `package.json`)
- Restart the dev server after changes
- Check that variables don't have quotes around values (unless needed)

### Issue: Proxy/Reverse Proxy
If running behind a proxy:
- The `next.config.mjs` now includes header configuration
- Ensure `NEXTAUTH_URL` matches your public-facing URL
- Check that proxy forwards `Host` header correctly

## 📝 Next Steps

1. **Create `.env.local` file** (if it doesn't exist) with the required variables
2. **Verify Google Cloud Console** redirect URI matches exactly
3. **Restart dev server** to load new environment variables
4. **Check debug output** when server starts to confirm variables are loaded
5. **Test authentication flow** and check for any error messages

## 🔗 Useful Links

- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
