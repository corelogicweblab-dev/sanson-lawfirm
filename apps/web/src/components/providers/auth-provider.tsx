"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { api } from "@/lib/api";
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
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setToken(token);
        api.setToken(token);

        const displayName = firebaseUser.displayName?.split(" ") ?? [];
        const response = await api.syncUser({
          first_name: displayName[0] || "User",
          last_name: displayName.slice(1).join(" ") || "",
          role: "CLIENT",
        });

        if (response.success && response.data) {
          setUser(response.data.user);
        }
      } else {
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setToken, setLoading]);

  return <>{children}</>;
}
