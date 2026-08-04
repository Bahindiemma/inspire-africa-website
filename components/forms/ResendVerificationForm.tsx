"use client";

/**
 * "Send it again" on the check-email page.
 *
 * Server Action so it works without JavaScript, like the rest of signup.
 * The response is deliberately the same whatever happens — the endpoint must
 * not reveal whether a given clickId exists or is already verified.
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
