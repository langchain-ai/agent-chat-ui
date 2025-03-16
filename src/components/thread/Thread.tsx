import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { createLanggraphClient } from '@/lib/langgraph-client';

export function Thread() {
  const { session } = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const client = createLanggraphClient(session.access_token);
    // Use the authenticated client to make API calls
    // Example:
    // client.someApiCall().then(setData);
  }, [session]);

  return (
    <div>
      {/* Your thread component UI */}
    </div>
  );
} 