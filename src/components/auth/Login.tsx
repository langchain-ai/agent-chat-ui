import { createSupabaseClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function Login() {
  try {
    const { session, loading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
      // If user is already logged in, redirect to home
      if (!loading && session?.access_token) {
        navigate('/', { replace: true });
      }
    }, [session, loading, navigate]);

    const handleLogin = async (provider: 'google' | 'github') => {
      try {
        const supabase = createSupabaseClient();
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: false,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          },
        });

        if (error) {
          console.error('[Login] Login error:', error.message);
        }
      } catch (error) {
        console.error('[Login] Error creating Supabase client or signing in:', error);
      }
    };

    // Show loading state while checking session
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait while we verify your session.</p>
          </div>
        </div>
      );
    }

    // Don't show login page if already logged in
    if (session?.access_token) {
      return null;
    }

    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <button 
          onClick={() => handleLogin('google')} 
          className="w-64 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
        <button 
          onClick={() => handleLogin('github')} 
          className="w-64 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Sign in with GitHub
        </button>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>An error occurred while loading the login page.</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
} 