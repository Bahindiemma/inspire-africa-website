"use client";

import type { FormEvent } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

const INTEREST = [
  "Bilateral labour mobility pathway",
  "Workforce planning support",
  "MoU / framework agreement",
  "Pilot programme",
  "Other",
];

export function GovernmentsForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert(
      "In production this form is replaced by the Wix Forms widget linked to form ID ed131203-fd0f-4832-bc3a-5f53b613bc78."
    );
  }
  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="gf-name">Full name</label>
        <input id="gf-name" name="name" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="gf-role">Role / title</label>
        <input id="gf-role" name="role" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="gf-org">Organisation / Ministry</label>
        <input id="gf-org" name="organisation" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="gf-country">Country</label>
        <input id="gf-country" name="country" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="gf-email">Official email</label>
        <input id="gf-email" name="email" type="email" required />
      </div>
      <div className="form-field">
        <label htmlFor="gf-phone">Phone</label>
        <input id="gf-phone" name="phone" type="tel" />
      </div>
      <div className="form-field full">
        <label htmlFor="gf-interest">Type of partnership</label>
        <select id="gf-interest" name="interest" defaultValue={INTEREST[0]}>
          {INTEREST.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="form-field full">
        <label htmlFor="gf-priorities">Priority sectors or corridors of interest</label>
        <input id="gf-priorities" name="priorities" type="text" placeholder="e.g. healthcare to UK, hospitality to Saudi Arabia" />
      </div>
      <div className="form-field full">
        <label htmlFor="gf-message">Briefly describe what you&apos;d like to explore</label>
        <textarea id="gf-message" name="message" required />
      </div>
      <div className="form-submit">
        <button type="submit" className="btn btn--primary">
          Send enquiry
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}
