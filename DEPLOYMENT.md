# AWS Amplify Deployment Guide

## Prerequisites
- AWS Account with Amplify access
- Domain `facetai.com` with DNS control
- Repository pushed to Git (GitHub/GitLab/etc.)

## Step 1: AWS Cognito Configuration
1. Go to **AWS Cognito Console** → User Pools → `eu-west-1_g0pQfMI4m`
2. Navigate to **App integration** → **App clients**
3. Select your app client
4. Edit **Hosted UI** settings:
   - **Allowed callback URLs**: Add `https://chat.facetai.com/api/auth/callback/cognito`
   - **Allowed sign-out URLs**: Add `https://chat.facetai.com`
5. Edit **Attribute read and write permissions** if needed
6. Under **Resource servers** → **Amazon Cognito User Pool**, ensure CORS origins include `https://chat.facetai.com`

## Step 2: AWS Amplify Setup
1. Go to **AWS Amplify Console**
2. Click **Create new app** → **Host web app**
3. Connect to your Git provider and select the repository
4. **Branch**: `main` (or your production branch)
5. **App name**: `facetai-chat`
6. **Build settings**: Amplify will detect the `amplify.yml` file automatically
7. Review and **Save and deploy**

## Step 3: Environment Variables
In Amplify Console → **Environment variables**, add your production values:

```bash
NEXTAUTH_SECRET="your-secure-random-string-for-production"
NEXTAUTH_URL="https://chat.facetai.com"
COGNITO_CLIENT_ID="your-production-cognito-client-id"
COGNITO_CLIENT_SECRET="your-production-cognito-client-secret"
COGNITO_ISSUER="https://cognito-idp.region.amazonaws.com/user-pool-id"
NEXT_PUBLIC_ASSISTANT_ID="your-assistant-id"
LANGGRAPH_API_URL="your-production-langgraph-api-url"
NEXT_PUBLIC_API_URL="/api"
LANGSMITH_API_KEY="your-production-langsmith-api-key"
```

**Important**: Use your actual production credentials, not the placeholder values above!

## Step 4: Custom Domain
1. In Amplify Console → **Domain management**
2. Click **Add domain**
3. Enter: `facetai.com`
4. **Subdomain**: `chat`
5. Follow DNS configuration instructions provided by Amplify
6. Wait for SSL certificate validation (can take up to 24 hours)

## Step 5: Final Verification
1. Wait for deployment to complete
2. Test authentication at `https://chat.facetai.com`
3. Verify all features work correctly
4. Monitor CloudWatch logs for any issues

## Architecture Overview
- **Frontend**: Next.js app hosted on AWS Amplify
- **Authentication**: AWS Cognito User Pool
- **API**: LangGraph API proxy through Next.js API routes
- **Domain**: chat.facetai.com with SSL

## Rollback Plan
If issues occur:
1. In Amplify Console → **App settings** → **Rewrites and redirects**
2. Add temporary redirect to previous version
3. Or redeploy previous Git commit

## Production Notes
- Uses API proxy pattern (`/api`) instead of direct LangGraph connection
- Environment variables are server-side only (except NEXT_PUBLIC_* vars)
- Logs available in CloudWatch
- Automatic deployments on Git push to main branch