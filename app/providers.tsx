'use client';
import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import { ToastProvider } from '@/context/toast';
import { Backdrop } from '@/components/backdrop';

const GOOGLE_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function Providers({ children }: { children: ReactNode }) {
  const tree = (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Backdrop />
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
  return GOOGLE_ID ? <GoogleOAuthProvider clientId={GOOGLE_ID}>{tree}</GoogleOAuthProvider> : tree;
}
