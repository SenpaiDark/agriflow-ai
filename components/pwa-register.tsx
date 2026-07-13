"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA features need a secure context (HTTPS or localhost);
        // the app itself works fine without the service worker.
      });
    }
  }, []);

  return null;
}
