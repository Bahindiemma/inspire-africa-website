"use client";

import { useConsent } from "./ConsentProvider";

/** Footer control to reopen the consent preferences (and withdraw) any time. */
export function CookieSettingsLink() {
  const { openPreferences } = useConsent();
  return (
    <button type="button" className="footer-cookie-settings" onClick={openPreferences}>
      Cookie settings
    </button>
  );
}
