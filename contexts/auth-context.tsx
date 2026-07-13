"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  justLoggedIn: boolean;
  dismissWelcome: () => void;
}

/** Set by the login/signup pages right before redirecting to the dashboard. */
export const WELCOME_FLAG = "agriflow:just-logged-in";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  justLoggedIn: false,
  dismissWelcome: () => {},
});

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Consume the one-shot flag so the splash shows exactly once per sign-in.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(WELCOME_FLAG) === "1") {
        sessionStorage.removeItem(WELCOME_FLAG);
        setJustLoggedIn(true);
      }
    } catch {
      // sessionStorage unavailable (private mode etc.) — skip the splash.
    }
  }, []);

  const dismissWelcome = useCallback(() => setJustLoggedIn(false), []);

  return (
    <AuthContext.Provider value={{ user, justLoggedIn, dismissWelcome }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
