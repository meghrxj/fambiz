'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('ff_auth');
    setTimeout(() => {
      setIsAuthenticated(auth === 'true');
      setIsLoaded(true);
    }, 0);
  }, []);

  const login = (password: string) => {
    if (password === 'laxmigole2004') {
      setIsAuthenticated(true);
      localStorage.setItem('ff_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ff_auth');
  };

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
