import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserConfig, UserConfig } from "./config/users";
import jwt from "jsonwebtoken";

// Extend built-in session types to include our custom fields
declare module "next-auth" {
    interface Session {
        user: UserConfig & DefaultSession["user"] & {
            idToken?: string; // This will now be our custom signed Backend Token
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT extends UserConfig {
        idToken?: string;
    }
}

// Get the secret - prefer REFLEXION_JWT_SECRET, fallback to NEXTAUTH_SECRET for backward compatibility
const authSecret = process.env.REFLEXION_JWT_SECRET || process.env.NEXTAUTH_SECRET;

// Debug logging for environment variables (remove in production)
if (process.env.NODE_ENV !== 'production') {
    console.log('[AUTH DEBUG] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
    console.log('[AUTH DEBUG] AUTH_GOOGLE_ID:', process.env.AUTH_GOOGLE_ID ? 'Set' : 'MISSING');
    console.log('[AUTH DEBUG] AUTH_GOOGLE_SECRET:', process.env.AUTH_GOOGLE_SECRET ? 'Set' : 'MISSING');
    console.log('[AUTH DEBUG] REFLEXION_JWT_SECRET:', process.env.REFLEXION_JWT_SECRET ? 'Set' : 'MISSING');
    console.log('[AUTH DEBUG] NEXTAUTH_SECRET (fallback):', process.env.NEXTAUTH_SECRET ? 'Set' : 'MISSING');
    console.log('[AUTH DEBUG] Using secret:', authSecret ? 'Set' : 'MISSING - AUTH WILL FAIL');
}

export const authOptions: NextAuthOptions = {
    // Explicitly set the base URL for NextAuth
    // This ensures the callback URL is constructed correctly
    ...(process.env.NEXTAUTH_URL && { 
        url: process.env.NEXTAUTH_URL 
    }),
    // Use REFLEXION_JWT_SECRET as the primary secret for NextAuth
    secret: authSecret,
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, account, user }) {
            // On initial sign in
            if (account && user) {
                // Preserve standard profile fields
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;

                // 1. Look up Organization/Role info from Backend
                const userEmail = user.email;
                let config = getUserConfig(userEmail);

                try {
                    let backendUrl = process.env.LANGGRAPH_API_URL || "https://reflexion-staging.up.railway.app";
                    if (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

                    const profileUrl = `${backendUrl}/auth/profile?email=${userEmail}`;
                    console.log(`[AUTH] Profile lookup for ${userEmail}`);

                    const resp = await fetch(profileUrl, {
                        headers: { "X-Api-Key": process.env.LANGSMITH_API_KEY! }
                    });
                    if (resp.ok) {
                        const profile = await resp.json();
                        config = {
                            customerId: profile.customerId || config.customerId,
                            projectId: config.projectId || "demo-project",
                            role: profile.role || config.role
                        };
                    }
                } catch (e) {
                    console.error(`[AUTH] Exception during profile lookup:`, e);
                }

                token.customerId = config.customerId;
                token.projectId = config.projectId;
                token.role = config.role;

                // 2. Mint Backend-Compatible Token
                // Use REFLEXION_JWT_SECRET to match backend validation
                // Fallback to NEXTAUTH_SECRET if REFLEXION_JWT_SECRET is not set (for backward compatibility)
                const jwtSecret = authSecret!;
                
                const backendPayload = {
                    sub: userEmail,
                    email: userEmail,
                    customer_id: config.customerId,
                    project_id: config.projectId,
                    role: config.role,
                };

                token.idToken = jwt.sign(backendPayload, jwtSecret, {
                    algorithm: "HS256",
                    expiresIn: "7d"
                });
                console.log(`[AUTH] New session for ${userEmail}. Org: ${config.customerId}`);

            } else if (token.customerId && token.projectId && token.email) {
                // Maintenance: Check if idToken is expired or expiring soon
                let shouldRefresh = !token.idToken;
                if (token.idToken) {
                    try {
                        const decoded = jwt.decode(token.idToken) as any;
                        if (decoded && decoded.exp) {
                            const now = Math.floor(Date.now() / 1000);
                            // Refresh if less than 2 hours left
                            if (decoded.exp - now < 7200) shouldRefresh = true;
                        } else {
                            shouldRefresh = true;
                        }
                    } catch (e) {
                        shouldRefresh = true;
                    }
                }

                if (shouldRefresh) {
                    // Use REFLEXION_JWT_SECRET to match backend validation
                    // Fallback to NEXTAUTH_SECRET if REFLEXION_JWT_SECRET is not set (for backward compatibility)
                    const jwtSecret = authSecret!;
                    
                    const backendPayload = {
                        sub: token.email,
                        email: token.email,
                        customer_id: token.customerId,
                        project_id: token.projectId,
                        role: token.role,
                    };
                    token.idToken = jwt.sign(backendPayload, jwtSecret, {
                        algorithm: "HS256",
                        expiresIn: "7d"
                    });
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.customerId = token.customerId as string;
                session.user.projectId = token.projectId as string;
                session.user.role = token.role as any;
                session.user.idToken = token.idToken as string;

                // Explicitly restore profile fields from token
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.image = token.picture as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/",
    }
};
