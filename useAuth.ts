// src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface AuthUser {
  role: 'student' | 'instructor';
  contextId: string;
}

export const useAuth = () => {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse LTI-like launch params from URL
    const params = new URLSearchParams(location.search);
    const role = params.get('user_role');
    const contextId = params.get('context_id') || 'Default Course';

    // Validate role
    if (role === 'student' || role === 'instructor') {
      const authUser: AuthUser = { role, contextId };
      setUser(authUser);
      localStorage.setItem('user_role', role);
      localStorage.setItem('context_id', contextId);
    } else {
      // Fallback to localStorage (for post-login navigation)
      const savedRole = localStorage.getItem('user_role');
      const savedContext = localStorage.getItem('context_id') || 'Default Course';
      if (savedRole === 'student' || savedRole === 'instructor') {
        setUser({ role: savedRole, contextId: savedContext });
      }
    }
    setLoading(false);
  }, [location]);

  return { user, loading };
};