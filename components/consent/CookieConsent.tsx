"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useConsent } from "./ConsentProvider";

/**
 * Cookie consent banner + preferences modal. Renders nothing until the
 * client has read the consent cookie (ready), so there's no SSR flash and
 * no layout shift for visitors who've already decided.
 */
export function CookieConsent() {
  const {
    ready,
    bannerOpen,
    prefsOpen,
    record,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useConsent();

  if (!ready) return null;

  return (
    <>
      {bannerOpen && !prefsOpen && (
        <div
          className="cookie-banner"
          role="region"
          aria-label="Cookie consent"
        >
          <div className="cookie-banner-inner">
            <div className="cookie-banner-copy">
              <strong>We value your privacy.</strong> We use a strictly-necessary
              cookie to remember this choice, and — only if you agree — first-party
              analytics cookies to understand how the site is used. We never sell your
              data. See our{" "}
              <Link href="/cookies">Cookie Policy</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </div>
            <div className="cookie-banner-actions">
              <button type="button" className="btn btn--ghost" onClick={openPreferences}>
                Manage preferences
              </button>
              <button type="button" className="btn btn--ghost" onClick={rejectAll}>
                Reject non-essential
              </button>
              <button type="button" className="btn btn--primary" onClick={acceptAll}>
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {prefsOpen && (
        <PreferencesModal
          initialAnalytics={record?.analytics ?? false}
          initialMarketing={record?.marketing ?? false}
          onSave={savePreferences}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onClose={closePreferences}
        />
      )}
    </>
  );
}

function PreferencesModal({
  initialAnalytics,
  initialMarketing,
  onSave,
  onAcceptAll,
  onRejectAll,
  onClose,
}: {
  initialAnalytics: boolean;
  initialMarketing: boolean;
  onSave: (p: { analytics: boolean; marketing: boolean }) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [marketing, setMarketing] = useState(initialMarketing);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="cookie-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cookie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        ref={dialogRef}
      >
        <h2 id="cookie-modal-title">Privacy preferences</h2>
        <p className="cookie-modal-lead">
          Choose which cookies you allow. Strictly-necessary cookies are always on
          because the site can&apos;t function without them. You can change this any time
          via &ldquo;Cookie settings&rdquo; in the footer.
        </p>

        <div className="cookie-cat">
          <div className="cookie-cat-head">
            <span className="cookie-cat-title">Strictly necessary</span>
            <span className="cookie-cat-on">Always on</span>
          </div>
          <p>Remember your consent choice and keep the site secure. No tracking.</p>
        </div>

        <label className="cookie-cat cookie-cat--toggle">
          <div className="cookie-cat-head">
            <span className="cookie-cat-title">Analytics</span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-describedby="cookie-cat-analytics-desc"
            />
          </div>
          <p id="cookie-cat-analytics-desc">
            First-party, privacy-respecting measurement: pages viewed, sections read and
            approximate country. No raw IP addresses are stored and we never share or sell
            your data.
          </p>
        </label>

        <label className="cookie-cat cookie-cat--toggle">
          <div className="cookie-cat-head">
            <span className="cookie-cat-title">Marketing</span>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              aria-describedby="cookie-cat-marketing-desc"
            />
          </div>
          <p id="cookie-cat-marketing-desc">
            Not currently used. Reserved for any future campaign measurement — off unless
            you turn it on.
          </p>
        </label>

        <div className="cookie-modal-actions">
          <button type="button" className="btn btn--ghost" ref={firstFocusRef} onClick={onRejectAll}>
            Reject non-essential
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onSave({ analytics, marketing })}
          >
            Save preferences
          </button>
          <button type="button" className="btn btn--primary" onClick={onAcceptAll}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
