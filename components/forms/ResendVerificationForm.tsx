"use client";

/**
 * "Send it again" on the check-email page.
 *
 * Server Action so it works without JavaScript, like the rest of signup.
 * Only rendered for workers (the register emails them a link into readiness).
 * The `for` field is posted so the action can refuse a forged resend for
 * anyone else. The register answers the same for a known and an unknown
 * clickId, so this cannot reveal which ids exist.
 */
import { useActionState } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { resendVerificationAction, type ResendState } from "@/app/join/check-email/actions";

const initial: ResendState = {};

export function ResendVerificationForm({ clickId }: { clickId: string }) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initial);

  return (
    <form action={formAction} style={{ marginTop: 24 }}>
      <input type="hidden" name="clickId" value={clickId} />
      <input type="hidden" name="for" value="worker" />
      {state.sent ? (
        <p role="status" style={{ fontWeight: 600 }}>
          Sent. Give it a minute, then check your inbox and spam folder.
        </p>
      ) : (
        <button type="submit" className="btn btn--ghost" disabled={pending}>
          {pending ? "Sending…" : "Send the link again"}
          <ArrowIcon />
        </button>
      )}
      {state.error ? (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
