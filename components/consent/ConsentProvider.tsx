"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACCEPTED_ALL,
  REJECTED,
  consentLevel,
  hasRejectSignal,
  readConsent,
  writeConsent,
  clearConsent,
  type ConsentLevel,
  type ConsentRecord,
} from "@/lib/consent";

interface ConsentContextValue {
  /** Null until the visitor has made (or we've inferred) a decision. */
  record: ConsentRecord | null;
  level: ConsentLevel;
  /** True once we've read the cookie on the client (avoids SSR flash). */
  ready: boolean;
  bannerOpen: boolean;
  prefsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (p: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  withdraw: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setRecord(stored);
    } else if (hasRejectSignal()) {
      // Honour GPC / DNT: treat as rejected without nagging with a banner.
      // Not persisted, so the visitor can still opt in via Cookie settings.
      setRecord({ ...REJECTED, ts: new Date().toISOString() });
    } else {
      setBannerOpen(true);
    }
    setReady(true);
  }, []);

  const acceptAll = useCallback(() => {
    setRecord(writeConsent(ACCEPTED_ALL));
    setBannerOpen(false);
    setPrefsOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    setRecord(writeConsent(REJECTED));
    setBannerOpen(false);
    setPrefsOpen(false);
  }, []);

  const savePreferences = useCallback(
    (p: { analytics: boolean; marketing: boolean }) => {
      setRecord(writeConsent({ analytics: p.analytics, marketing: p.marketing }));
      setBannerOpen(false);
      setPrefsOpen(false);
    },
    []
  );

  const openPreferences = useCallback(() => setPrefsOpen(true), []);
  const closePreferences = useCallback(() => setPrefsOpen(false), []);

  const withdraw = useCallback(() => {
    clearConsent();
    setRecord(null);
    setPrefsOpen(false);
    setBannerOpen(true);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      record,
      level: consentLevel(record),
      ready,
      bannerOpen,
      prefsOpen,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
      withdraw,
    }),
    [record, ready, bannerOpen, prefsOpen, acceptAll, rejectAll, savePreferences, openPreferences, closePreferences, withdraw]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    // Safe no-op fallback if used outside the provider.
    return {
      record: null,
      level: "necessary",
      ready: false,
      bannerOpen: false,
      prefsOpen: false,
      acceptAll: () => {},
      rejectAll: () => {},
      savePreferences: () => {},
      openPreferences: () => {},
      closePreferences: () => {},
      withdraw: () => {},
    };
  }
  return ctx;
}
