/**
 * First-party, consent-gated tracking client. Pure browser module (no
 * React) driven by <AnalyticsTracker/>. Only ever initialised AFTER the
 * visitor grants analytics consent, and fully torn down on withdrawal.
 *
 * Events are queued and flushed in batches to the same-origin ingest
 * proxy (/api/analytics) via sendBeacon — never blocking the UI, failing
 * silently. The proxy forwards to the CMS with the shared secret.
 */
import type { ConsentLevel } from "@/lib/consent";

type EventType =
  | "pageview"
  | "click"
  | "scroll_depth"
  | "section_view"
  | "outbound_click"
  | "form_start"
  | "form_submit"
  | "session_end";

interface TrackEvent {
  type: EventType;
  path: string;
  pageTitle?: string;
  referrer?: string;
  target?: string;
  sectionId?: string;
  scrollDepth?: number;
  occurredAt: string;
  meta?: Record<string, unknown>;
}

const INGEST_URL = "/api/analytics";
const SID_KEY = "ia_sid";
const SID_TS_KEY = "ia_sid_ts";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity
const FLUSH_INTERVAL_MS = 10_000;
const MAX_QUEUE = 50;
const SCROLL_MILESTONES = [25, 50, 75, 100];

let active = false;
let level: ConsentLevel = "analytics";
let queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let observer: IntersectionObserver | null = null;
let currentPath = "";
let scrollFired = new Set<number>();
let sectionsSeen = new Set<string>();
let startedForms = new WeakSet<HTMLFormElement>();
let scrollScheduled = false;
let utm = { source: null as string | null, medium: null as string | null, campaign: null as string | null };
let firstReferrer = "";

/* ----------------------------- session ----------------------------- */

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function getSessionId(): string {
  try {
    const now = Date.now();
    const ts = Number(sessionStorage.getItem(SID_TS_KEY) || 0);
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid || !ts || now - ts > SESSION_TIMEOUT_MS) {
      sid = uuid();
      sessionStorage.setItem(SID_KEY, sid);
    }
    sessionStorage.setItem(SID_TS_KEY, String(now));
    return sid;
  } catch {
    return uuid();
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SID_KEY);
    sessionStorage.removeItem(SID_TS_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------ queue ------------------------------ */

function enqueue(ev: Omit<TrackEvent, "occurredAt" | "path"> & { path?: string }) {
  if (!active) return;
  queue.push({
    occurredAt: new Date().toISOString(),
    path: ev.path ?? location.pathname + location.search,
    ...ev,
  });
  if (queue.length >= MAX_QUEUE) flush();
}

function flush() {
  if (!active || queue.length === 0) return;
  const events = queue;
  queue = [];
  const payload = {
    sessionId: getSessionId(),
    consentLevel: level,
    context: {
      path: location.pathname + location.search,
      title: document.title,
      referrer: firstReferrer,
      utm,
    },
    events,
  };
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(INGEST_URL, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never throw into the app */
  }
}

/* --------------------------- instrument ---------------------------- */

function onScroll() {
  if (scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(() => {
    scrollScheduled = false;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const pct = scrollable <= 0 ? 100 : Math.min(100, Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100));
    for (const m of SCROLL_MILESTONES) {
      if (pct >= m && !scrollFired.has(m)) {
        scrollFired.add(m);
        enqueue({ type: "scroll_depth", scrollDepth: m });
      }
    }
  });
}

function onClick(e: MouseEvent) {
  const el = e.target as Element | null;
  if (!el || !el.closest) return;

  const tracked = el.closest("[data-track]") as HTMLElement | null;
  if (tracked) {
    enqueue({
      type: "click",
      target: tracked.getAttribute("data-track") || describe(tracked),
      meta: datasetMeta(tracked),
    });
  }

  const link = el.closest("a[href]") as HTMLAnchorElement | null;
  if (link && link.href) {
    try {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) {
        enqueue({ type: "outbound_click", target: url.host + url.pathname });
      }
    } catch {
      /* ignore malformed href */
    }
  }
}

function onFocusIn(e: FocusEvent) {
  const form = (e.target as Element | null)?.closest?.("form") as HTMLFormElement | null;
  if (form && !startedForms.has(form)) {
    startedForms.add(form);
    enqueue({ type: "form_start", target: formName(form) });
  }
}

function onSubmit(e: Event) {
  const form = e.target as HTMLFormElement | null;
  if (form && form.tagName === "FORM") {
    enqueue({ type: "form_submit", target: formName(form) });
    flush(); // submits often navigate away
  }
}

function onVisibility() {
  if (document.visibilityState === "hidden") flush();
}

function describe(el: Element): string {
  const id = el.id ? `#${el.id}` : "";
  const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : "";
  return (el.tagName.toLowerCase() + id + cls).slice(0, 120);
}

function datasetMeta(el: HTMLElement): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(el.dataset)) {
    if (k === "track") continue;
    out[k] = el.dataset[k];
  }
  return Object.keys(out).length ? out : undefined;
}

function formName(form: HTMLFormElement): string {
  return (form.getAttribute("name") || form.id || form.getAttribute("data-track-form") || "form").slice(0, 120);
}

function observeSections() {
  if (observer) observer.disconnect();
  if (!("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const id = el.getAttribute("data-section") || el.id;
        if (!id || sectionsSeen.has(id)) continue;
        sectionsSeen.add(id);
        enqueue({ type: "section_view", sectionId: id });
      }
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll("[data-section], section[id]").forEach((el) => observer!.observe(el));
}

/* ------------------------------ public ----------------------------- */

export function initTracker(consentLevel: ConsentLevel) {
  if (active || typeof window === "undefined") return;
  if (consentLevel === "necessary") return;
  active = true;
  level = consentLevel;
  firstReferrer = document.referrer || "";

  try {
    const sp = new URLSearchParams(location.search);
    utm = {
      source: sp.get("utm_source"),
      medium: sp.get("utm_medium"),
      campaign: sp.get("utm_campaign"),
    };
  } catch {
    /* ignore */
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, { capture: true });
  document.addEventListener("focusin", onFocusIn, { capture: true });
  document.addEventListener("submit", onSubmit, { capture: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flush);
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);

  // First pageview for the current route.
  routeChanged(location.pathname + location.search, document.title);
}

export function setConsentLevel(consentLevel: ConsentLevel) {
  if (consentLevel === "necessary") return;
  level = consentLevel;
}

export function routeChanged(path: string, title?: string) {
  if (!active) return;
  if (path === currentPath) return;
  flush(); // ship the previous page's events
  currentPath = path;
  scrollFired = new Set();
  sectionsSeen = new Set();
  enqueue({ type: "pageview", path, pageTitle: title ?? document.title, referrer: firstReferrer });
  // Let the new DOM settle before observing sections.
  setTimeout(observeSections, 60);
}

export function teardownTracker() {
  if (!active) return;
  active = false;
  enqueue({ type: "session_end" });
  flush();
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  document.removeEventListener("focusin", onFocusIn, { capture: true } as EventListenerOptions);
  document.removeEventListener("submit", onSubmit, { capture: true } as EventListenerOptions);
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pagehide", flush);
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = null;
  if (observer) observer.disconnect();
  observer = null;
  queue = [];
  currentPath = "";
  clearSession();
}
