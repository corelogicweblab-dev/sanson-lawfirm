"use client";

import { useEffect, useState } from "react";
import { Smartphone, Monitor, Download } from "lucide-react";
import { Button, Card, CardContent } from "@sanson/ui";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installDesktop = async () => {
    if (!deferred) {
      alert(
        "On desktop: use your browser menu → Install SANSON Legal OS, or add to Home Screen from the address bar."
      );
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (installed) return null;

  return (
    <Card className={cn("sanson-stagger-item")} interactive>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-5 w-5 text-pink-300" />
          <h3 className="font-semibold text-white">Install SANSON Legal OS</h3>
        </div>
        <p className="mb-4 text-sm text-pink-100/80">
          Install on your device for faster access, home-screen launch, and a native app experience.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isIos ? (
            <Button variant="outline" className="flex-1" onClick={() => alert("Safari → Share → Add to Home Screen")}>
              <Smartphone className="h-4 w-4" />
              Install for iOS
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={() => alert("Chrome menu → Install app, or Add to Home screen on Android.")}>
              <Smartphone className="h-4 w-4" />
              Install for Android
            </Button>
          )}
          <Button className="flex-1" onClick={installDesktop}>
            <Monitor className="h-4 w-4" />
            Install Desktop App
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
