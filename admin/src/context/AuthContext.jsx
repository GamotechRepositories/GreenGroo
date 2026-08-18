import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('greengrocc_admin_user');
      return savedUser ? JSON.parse(savedUser) : {
        name: 'Super Admin',
        email: 'admin@greengrocc.com',
        role: 'superadmin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('greengrocc_admin_token') || 'demo_admin_jwt_token');

  const login = (userData, jwtToken = 'mock_jwt_token') => {
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
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
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
