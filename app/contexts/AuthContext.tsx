'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CustomerProfile } from '@/lib/dristaService';

interface AuthContextType {
  user: CustomerProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { first_name: string; last_name: string; phone: string; password: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.error || 'Something went wrong');
  return payload;
}

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: CustomerProfile | null }) {
  const [user, setUser] = useState<CustomerProfile | null>(initialUser);
  const [loading, setLoading] = useState(false);

  // Accepts a phone number or an email address as the identifier — phone is
  // the primary way customers sign up now, but an email still works for
  // anyone who has one on their account.
  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const body = identifier.includes('@') ? { email: identifier, password } : { phone: identifier, password };
      const payload = await postJson('/api/auth/login', body);
      setUser(payload.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { first_name: string; last_name: string; phone: string; password: string; email?: string }) => {
    setLoading(true);
    try {
      const payload = await postJson('/api/auth/register', data);
      setUser(payload.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
