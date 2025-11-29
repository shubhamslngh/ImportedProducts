'use client';

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WP_GRAPHQL_ENDPOINT } from './env';
const REFRESH_AUTH_MUTATION = `
  mutation RefreshAuthToken($jwtRefreshToken: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $jwtRefreshToken }) {
      authToken
      refreshToken
      user {
        id
        databaseId
        username
        email
        firstName
        lastName
        name
      }
    }
  }
`;

type SessionUser = {
  username?: string | null;
  email?: string | null;
  id?: string | null;
  databaseId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionValue {
  status: SessionStatus;
  authToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  setSession: (payload: { authToken: string | null; refreshToken?: string | null; user?: SessionUser | null }) => void;
  clearSession: () => void;
  refreshSession: () => Promise<string | null>;
  isRefreshing: boolean;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedAuth = sessionStorage.getItem('authToken');
    const storedRefresh = sessionStorage.getItem('refreshToken');
    let storedUser: SessionUser | null = null;
    try {
      const raw = sessionStorage.getItem('user');
      storedUser = raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Unable to parse stored user', error);
    }

    setAuthToken(storedAuth);
    setRefreshToken(storedRefresh);
    setUser(storedUser);
    setStatus(storedAuth ? 'authenticated' : 'unauthenticated');
  }, []);

  const persistValue = useCallback((key: string, value: string | null) => {
    if (typeof window === 'undefined') return;
    if (value) {
      sessionStorage.setItem(key, value);
    } else {
      sessionStorage.removeItem(key);
    }
  }, []);

  const mapUser = useCallback(
    (payload: any, fallback?: SessionUser | null): SessionUser | null => {
      const base = fallback ?? user ?? null;
      if (!payload) return base;
      return {
        id: payload.id ?? base?.id ?? null,
        databaseId: payload.databaseId ?? base?.databaseId ?? null,
        username: payload.username ?? base?.username ?? null,
        email: payload.email ?? base?.email ?? null,
        firstName: payload.firstName ?? base?.firstName ?? null,
        lastName: payload.lastName ?? base?.lastName ?? null,
        displayName: payload.name ?? base?.displayName ?? null,
      };
    },
    [user],
  );

  const setSession = useCallback(
    ({ authToken: nextAuth, refreshToken: nextRefresh, user: nextUser }: { authToken: string | null; refreshToken?: string | null; user?: SessionUser | null }) => {
      setAuthToken(nextAuth);
      setRefreshToken(nextRefresh ?? null);
      setUser(nextUser ?? null);
      setStatus(nextAuth ? 'authenticated' : 'unauthenticated');

      persistValue('authToken', nextAuth);
      persistValue('refreshToken', nextRefresh ?? null);
      if (typeof window !== 'undefined') {
        if (nextUser) {
          sessionStorage.setItem('user', JSON.stringify(nextUser));
        } else {
          sessionStorage.removeItem('user');
        }
      }
    },
    [persistValue],
  );

  const clearSession = useCallback(() => {
    setSession({ authToken: null, refreshToken: null, user: null });
  }, [setSession]);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      clearSession();
      return null;
    }
    setIsRefreshing(true);
    try {
      const response = await fetch(WP_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REFRESH_AUTH_MUTATION,
          variables: { jwtRefreshToken: refreshToken },
        }),
      });

      const result = await response.json();
      const payload = result?.data?.refreshJwtAuthToken;
      if (!response.ok || !payload?.authToken) {
        clearSession();
        return null;
      }

      const mappedUser = mapUser(payload.user);
      setSession({
        authToken: payload.authToken,
        refreshToken: payload.refreshToken ?? refreshToken,
        user: mappedUser ?? user ?? null,
      });
      return payload.authToken as string;
    } catch (error) {
      console.error('Failed to refresh auth token', error);
      clearSession();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, clearSession, setSession, user, mapUser]);

  useEffect(() => {
    if (!refreshToken || status !== 'authenticated') {
      return;
    }
    const interval = setInterval(() => {
      refreshSession();
    }, 55 * 60 * 1000); // roughly every 55 minutes
    return () => clearInterval(interval);
  }, [refreshToken, status, refreshSession]);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      authToken,
      refreshToken,
      user,
      setSession,
      clearSession,
      refreshSession,
      isRefreshing,
    }),
    [authToken, refreshToken, status, user, clearSession, setSession, refreshSession, isRefreshing],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
