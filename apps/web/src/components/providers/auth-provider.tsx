"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { inferRoleFromEmail, resolveSyncProfileNames } from "@sanson/shared";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { api } from "@/lib/api";
import { pingApiHealth } from "@/lib/api-request";
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
        if (firebaseUser) {
          const [token] = await Promise.all([
            firebaseUser.getIdToken(),
            pingApiHealth(),
          ]);
          setToken(token);
          api.setToken(token);

          const email = firebaseUser.email ?? "";
          const parts = firebaseUser.displayName?.split(" ") ?? [];
          const names = resolveSyncProfileNames(email, {
            first_name: parts[0],
            last_name: parts.slice(1).join(" "),
          });
          const response = await api.syncUser({
            ...names,
            role: inferRoleFromEmail(email),
          });

          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            setUser(null);
          }
        } else {
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setToken, setLoading]);

  return <>{children}</>;
}
