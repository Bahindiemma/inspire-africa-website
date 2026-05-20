"use client";

import type { FormEvent } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

const AUDIENCES = [
  "Worker — interested in opportunities abroad",
  "Employer — looking to hire",
  "Government / Agency representative",
  "Partner — recruiter, training provider, or other",
  "Press / media",
  "Other",
];

export function ContactForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("In production this is a native Wix Forms contact form, with submissions routed to info@inspireafricans.com.");
  }
  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-field full">
        <label htmlFor="cf-audience">I am a…</label>
        <select id="cf-audience" name="audience" required defaultValue="">
          <option value="" disabled>
            Please select
          </option>
          {AUDIENCES.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="cf-first">First name</label>
        <input id="cf-first" name="firstName" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="cf-last">Last name</label>
        <input id="cf-last" name="lastName" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="cf-email">Email</label>
        <input id="cf-email" name="email" type="email" required />
      </div>
      <div className="form-field">
        <label htmlFor="cf-country">Country</label>
        <input id="cf-country" name="country" type="text" />
      </div>
      <div className="form-field full">
        <label htmlFor="cf-message">Your message</label>
        <textarea id="cf-message" name="message" required />
      </div>
      <div className="form-submit">
        <button type="submit" className="btn btn--primary">
          Send message
          <ArrowIcon />
        </button>
      </div>
    </form>
  );
}
