"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";
import {
  initTracker,
  teardownTracker,
  routeChanged,
  setConsentLevel,
} from "@/lib/analytics/tracker";

/**
 * Mounts in the root layout but does nothing until analytics consent is
 * granted. On withdrawal (level → "necessary") it tears the tracker down
 * and clears the session. Fires a pageview on every App Router navigation.
 */
export function AnalyticsTracker() {
  const { level, ready } = useConsent();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (level === "necessary") {
      teardownTracker();
      return;
    }
    initTracker(level);
    setConsentLevel(level);
  }, [ready, level]);

  useEffect(() => {
    if (!ready || level === "necessary" || typeof window === "undefined") return;
    routeChanged(window.location.pathname + window.location.search, document.title);
  }, [pathname, ready, level]);

  return null;
}
