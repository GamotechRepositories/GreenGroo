import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

function readStoredToken() {
  const token = localStorage.getItem('greengrocc_admin_token');
  if (!token || token === 'demo_admin_jwt_token' || token === 'mock_jwt_token') return '';
  return token;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      if (!readStoredToken()) return null;
      const savedUser = localStorage.getItem('greengrocc_admin_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => readStoredToken());

  const login = (userData, jwtToken) => {
    if (!userData || !jwtToken) return;
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('greengrocc_admin_user', JSON.stringify(userData));
    localStorage.setItem('greengrocc_admin_token', jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('greengrocc_admin_user');
    localStorage.removeItem('greengrocc_admin_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
