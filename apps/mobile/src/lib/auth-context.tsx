import React, { createContext, useContext, useEffect, useState } from "react";
import type { MobileDashboard, User, UserRole } from "@sanson/types";
import { api, setApiToken } from "@/lib/api";
import { clearSession, getToken, getUserJson, saveToken, saveUserJson } from "@/lib/secure-storage";
import { firebaseLogout } from "@/lib/firebase";
import { cacheSet, cacheGet } from "@/lib/offline-queue";

interface AuthState {
  user: User | null;
  dashboard: MobileDashboard | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<MobileDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const res = await api.mobileBootstrap();
    if (res.success && res.data) {
      setUser(res.data.user as unknown as User);
      setDashboard(res.data.dashboard);
      await cacheSet("dashboard", res.data.dashboard);
    }
  };

  const signIn = async (token: string) => {
    setApiToken(token);
    await saveToken(token);
    const sync = await api.syncUser({ role: "CLIENT" });
    if (sync.success && sync.data) {
      setUser(sync.data.user);
      await saveUserJson(JSON.stringify(sync.data.user));
    }
    await refresh();
  };

  const signOut = async () => {
    setApiToken(null);
    setUser(null);
    setDashboard(null);
    await clearSession();
    await firebaseLogout();
  };

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) {
        setApiToken(t);
        const cached = await getUserJson();
        if (cached) setUser(JSON.parse(cached));
        const dash = await cacheGet<MobileDashboard>("dashboard");
        if (dash) setDashboard(dash);
        try {
          await refresh();
        } catch {
          /* offline — use cache */
        }
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dashboard, loading, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}

export function roleHome(role: UserRole | string): string {
  const map: Record<string, string> = {
    CLIENT: "/(tabs)",
    LAWYER: "/(tabs)",
    PARALEGAL: "/(tabs)",
    ADMIN: "/(tabs)",
  };
  return map[role] || "/(tabs)";
}
