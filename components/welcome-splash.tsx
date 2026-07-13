"use client";

import { useEffect, useState } from "react";
import { DM_Serif_Display } from "next/font/google";
import { useAuth } from "@/contexts/auth-context";

const displaySerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" });

const SPARKS = [
  { left: "10%", top: "22%", delay: "0s" },
  { left: "20%", top: "70%", delay: "0.4s" },
  { left: "32%", top: "12%", delay: "0.9s" },
  { left: "55%", top: "80%", delay: "0.2s" },
  { left: "70%", top: "18%", delay: "1.3s" },
  { left: "84%", top: "60%", delay: "0.7s" },
  { left: "92%", top: "30%", delay: "1.7s" },
];

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeSplash() {
  const { user, justLoggedIn, dismissWelcome } = useAuth();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!justLoggedIn || !user) return;
    const fadeTimer = setTimeout(() => setLeaving(true), 2550);
    const doneTimer = setTimeout(() => dismissWelcome(), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [justLoggedIn, user, dismissWelcome]);

  if (!justLoggedIn || !user) return null;

  const greeting = greetingForHour(new Date().getHours());
  const firstName = user.name.split(" ")[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`welcome-overlay${leaving ? " welcome-leaving" : ""}`}
    >
      <div className="welcome-card">
        <span className="welcome-aurora" aria-hidden="true" />
        <span className="welcome-aurora welcome-aurora-two" aria-hidden="true" />
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="welcome-spark"
            aria-hidden="true"
            style={{ left: s.left, top: s.top, animationDelay: s.delay }}
          />
        ))}
        <div className="welcome-content">
          <span className="welcome-wave" aria-hidden="true">
            👋
          </span>
          <p className="welcome-greet">{greeting}</p>
          <p className={`welcome-name ${displaySerif.className}`}>
            {firstName}
          </p>
          <p className="welcome-sub">Welcome back to AgriFlow AI</p>
        </div>
      </div>
    </div>
  );
}
