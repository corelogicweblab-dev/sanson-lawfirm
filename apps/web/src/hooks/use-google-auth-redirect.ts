"use client";

import { useEffect, useRef } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { completeGoogleRedirectSignIn } from "@/lib/google-auth";
import {
  firebaseAuthErrorMessage,
  syncFromGoogleCredential,
} from "@/lib/firebase-auth-flow";

type Options = {
  onSuccess: (result: { user: import("@sanson/types").User; redirectPath: string }) => void;
  onError: (message: string) => void;
  setLoading: (loading: boolean) => void;
};

/** Completes Google sign-in when the user returns from redirect. */
export function useGoogleAuthRedirect({ onSuccess, onError, setLoading }: Options) {
  const ran = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || ran.current) return;
    ran.current = true;

    let cancelled = false;

    (async () => {
      try {
        const credential = await completeGoogleRedirectSignIn();
        if (cancelled || !credential) return;
        setLoading(true);
        const result = await syncFromGoogleCredential(credential);
        if (cancelled) return;
        if (result.ok) {
          onSuccess({ user: result.user, redirectPath: result.redirectPath });
        } else {
          onError(result.message);
        }
      } catch (err) {
        if (!cancelled) onError(firebaseAuthErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError, setLoading]);
}
