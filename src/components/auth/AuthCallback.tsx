import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupabaseClient } from '@/lib/supabase/client';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createSupabaseClient();
      
      try {
        // Get the error query parameter
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const error_description = params.get('error_description');

        if (error) {
          throw new Error(error_description || 'Authentication error');
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!data.session) {
          // If no session, try to exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        // Get the intended destination
        const next = params.get('next') ?? '/';
        navigate(next);
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
} 