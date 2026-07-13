'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { TenantProfile } from '@/lib/dristaService';

interface TenantContextType {
  tenantProfile: TenantProfile | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// TenantProfile is fetched server-side (layout.tsx) and passed in as a prop —
// dristaFetch relies on a server-only API key that isn't available in the browser.
export function TenantProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile: TenantProfile | null;
}) {
  return (
    <TenantContext.Provider value={{ tenantProfile: initialProfile, loading: false }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
