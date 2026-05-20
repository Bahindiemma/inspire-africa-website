"use client";

import type { FormEvent } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";

const SECTORS = [
  "Healthcare",
  "Hospitality",
  "Engineering",
  "Mechanics",
  "Mining",
  "Construction",
  "Care & domestic",
  "Other",
];

export function EmployersForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert(
      "In production this form is replaced by the Wix Forms widget linked to form ID 83cf4816-c7e5-4fc1-8502-556c4f8cc1a7."
    );
  }
  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="ef-name">Full name</label>
        <input id="ef-name" name="name" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="ef-company">Company</label>
        <input id="ef-company" name="company" type="text" required />
      </div>
      <div className="form-field">
        <label htmlFor="ef-role">Role</label>
        <input id="ef-role" name="role" type="text" />
      </div>
      <div className="form-field">
        <label htmlFor="ef-email">Work email</label>
        <input id="ef-email" name="email" type="email" required />
      </div>
      <div className="form-field">
        <label htmlFor="ef-phone">Phone</label>
        <input id="ef-phone" name="phone" type="tel" />
      </div>
      <div className="form-field">
        <label htmlFor="ef-country">Hiring country</label>
        <input id="ef-country" name="country" type="text" />
      </div>
      <div className="form-field full">
        <label htmlFor="ef-sector">Sector</label>
        <select id="ef-sector" name="sector" defaultValue="Healthcare">
          {SECTORS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="form-field full">
        <label htmlFor="ef-volume">Anticipated hiring volume (12 months)</label>
        <input id="ef-volume" name="volume" type="text" placeholder="e.g. 10–20 nurses, ramping to 50" />
      </div>
      <div className="form-field full">
        <label htmlFor="ef-message">Tell us about your hiring needs</label>
        <textarea id="ef-message" name="message" required />
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
