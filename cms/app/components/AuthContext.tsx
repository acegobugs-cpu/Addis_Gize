"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "../types/types";
import { fetchWithAuth } from "../lib/fetchWithAuth";

// -----------------
// Auth Context Types
// -----------------
interface AuthContextType {
  user: Partial<User> | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

// -----------------
// Create Context
// -----------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------
// Auth Provider
// -----------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from Go backend
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data ?? null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run initializations sequentially on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      await refreshUser();
    };

    initializeAuth();
  }, [refreshUser]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // The browser automatically transmits your HttpOnly CSRF cookies here
      await fetch("/api/proxy/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout backend notification failed:", err);
    } finally {
      // Wipe state memory and route home—Go's response headers will wipe the actual cookies
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  // Intercepting Fetch Wrapper
  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      // Setup base fetch configurations
      const currentInit = {
        ...init,
        credentials: init?.credentials || "include", // Guarantee cookies pass through silently
      };

      // Execute request through your token auto-refresh lifecycle framework
      const response = await fetchWithAuth(input, {
        ...currentInit,
        updateUser: refreshUser,
      });

      // Edge case fallback handling: If the server returns a 403 Forbidden because 
      // a CSRF session expired out, silently request a fresh pair and retry once.
      if (response.status === 403) {
        return fetchWithAuth(input, { ...currentInit, updateUser: refreshUser });
      }

      return response;
    },
    [refreshUser],
  );

  const value: AuthContextType = {
    user,
    setUser,
    logout,
    isAuthenticated: !!user,
    isLoading,
    refreshUser,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -----------------
// Custom Hook
// -----------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}