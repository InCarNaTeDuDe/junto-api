import { useState, useEffect } from 'react';

export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  rating: number;
  walletBalance: number;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error('[useAuth Error] Could not sync user state', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, refetchUser: fetchUser };
}
