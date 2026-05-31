import { create } from "zustand";
import type { User, UserRole } from "@sanson/types";
import { getDashboardPath } from "@sanson/utils";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  firebaseToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  getRole: () => UserRole | null;
  getDashboardPath: () => string;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseToken: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setToken: (token) => {
    api.setToken(token);
    set({ firebaseToken: token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // Continue logout even if API fails
    }
    api.setToken(null);
    set({ user: null, firebaseToken: null, isAuthenticated: false });
  },

  getRole: () => {
    const user = get().user;
    return (user?.role?.name as UserRole) ?? null;
  },

  getDashboardPath: () => {
    const role = get().getRole();
    return role ? getDashboardPath(role) : "/login";
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user?.role) return false;
    if (user.role.name === "ADMIN") return true;
    return user.role.permissions?.some((p) => p.name === permission) ?? false;
  },
}));
