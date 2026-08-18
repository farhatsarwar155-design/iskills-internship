'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api, { setAccessToken } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT';
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  resendOTP: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoutState = useCallback(() => {
    setUser(null);
    setToken(null);
    setAccessToken('');
    setIsLoading(false);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.log('Not authenticated (no active session)');
      handleLogoutState();
    } finally {
      setIsLoading(false);
    }
  }, [handleLogoutState]);

  // Initial authentication check
  useEffect(() => {
    const initAuth = async () => {
      // First try to refresh the token directly
      try {
        const response = await api.post('/auth/refresh', {});
        const { token: newToken, user: newUser } = response.data;
        setToken(newToken);
        setAccessToken(newToken);
        setUser(newUser);
        setIsLoading(false);
      } catch (err) {
        // If refresh fails, try /auth/me just in case (e.g. if access token already exists somehow)
        await fetchCurrentUser();
      }
    };

    initAuth();
  }, [fetchCurrentUser]);

  // Listen for auth events from api.ts
  useEffect(() => {
    const handleRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{ token: string; user: User }>;
      setToken(customEvent.detail.token);
      setUser(customEvent.detail.user);
    };

    const handleExpired = () => {
      handleLogoutState();
      if (!['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password'].includes(pathname)) {
        router.push('/login');
      }
    };

    window.addEventListener('auth-token-refreshed', handleRefreshed);
    window.addEventListener('auth-session-expired', handleExpired);

    return () => {
      window.removeEventListener('auth-token-refreshed', handleRefreshed);
      window.removeEventListener('auth-session-expired', handleExpired);
    };
  }, [handleLogoutState, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAccessToken('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newAccessToken, user: loggedUser } = response.data;
      setToken(newAccessToken);
      setAccessToken(newAccessToken);
      setUser(loggedUser);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      const errRes = error.response?.data;
      if (errRes?.code === 'EMAIL_UNVERIFIED') {
        const err = new Error(errRes.message || 'Please verify your email before logging in') as any;
        err.email = errRes.email;
        err.mockOtp = errRes.mockOtp;
        err.isUnverified = true;
        throw err;
      }
      throw new Error(errRes?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password, name });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error: any) {
      const errRes = error.response?.data;
      const err = new Error(errRes?.message || 'Verification failed') as any;
      err.code = errRes?.code;
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      return response.data;
    } catch (error: any) {
      const errRes = error.response?.data;
      const err = new Error(errRes?.message || 'Failed to reset password') as any;
      err.code = errRes?.code;
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      handleLogoutState();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
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
