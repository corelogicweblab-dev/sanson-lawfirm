"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { syncFirebaseUser } from "@/lib/firebase-auth-flow";
import { prefetchLawyerDashboard } from "@/lib/dashboard-cache";
import { useAuthStore } from "@/store/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, setLoading } = useAuthStore();

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setToken(null);
          setUser(null);
          return;
        }

        const result = await syncFirebaseUser(firebaseUser);
        if (result.ok) {
          setToken(result.token);
          api.setToken(result.token);
          setUser(result.user);
          if (result.user.role?.name === "LAWYER") {
            void prefetchLawyerDashboard();
          }
        } else {
          const existing = useAuthStore.getState().user;
          if (!existing) setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setToken, setLoading]);

  return <>{children}</>;
}
