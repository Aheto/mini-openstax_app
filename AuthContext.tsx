
import React, { createContext, useState, useEffect } from 'react';

type User = { id: string; role: 'student' | 'instructor'; name: string } | null;

type AuthContextType = {
  user: User;
  login: (userData: User) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  // Simulate login for MVP (later: call /api/login)
  const login = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Restore login on refresh
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};