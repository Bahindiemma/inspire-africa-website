/**
 * Editorial / blog content for INSPIRE AFRICA.
 *
 * Posts are authored as structured sections rather than free HTML so the
 * blog detail template can render them with consistent styling and so we
 * can add new section types (callouts, lists, pull-quotes) without
 * touching individual post bodies.
 */

export type BlogSection =
  | { kind: "lede"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "callout"; title: string; text: string }
  | { kind: "quote"; text: string; attribution?: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  /** ISO date, e.g. "2026-05-12" */
  date: string;
  readMinutes: number;
  heroImage: string;
  heroAlt: string;
  tags: string[];
  body: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "the-real-cost-of-free-migration",
    title: "The real cost of “free” migration: why African workers still pay the price",
    excerpt:
      "A year after the ILO’s latest fee data, the gap between policy and practice along West Africa–Gulf corridors is still costing workers up to nine months of wages. Here’s what the numbers show — and what changes when employers pay.",
    category: "Ethical Recruitment",
    author: "Editorial Desk",
    authorRole: "INSPIRE AFRICA",
    date: "2026-05-12",
    readMinutes: 7,
    heroImage: "/images/inspire-handshake-interview.jpg",
    heroAlt: "Two African professionals in conversation across a desk",
    tags: ["Worker protection", "Recruitment fees", "Gulf corridor", "Policy"],
    body: [
      {
        kind: "lede",
        text:
          "The official position across most destination markets is unambiguous: workers should not pay to be recruited. The lived reality in 2026 is something else. New data from the ILO’s 2025 corridor study shows the average West African worker placed in Gulf hospitality or construction still pays the equivalent of 7–9 months of destination wages in upfront fees — before earning their first paycheck.",
      },
      { kind: "h2", text: "The gap between policy and practice" },
      {
        kind: "p",
        text:
          "Eighteen destination countries have now adopted some version of the “employer pays” principle in their published recruitment guidance. The IRIS standard, the UK’s Modern Slavery framework, and the Bali Process all converge on the same baseline: recruitment fees and related costs are an employer cost, not a worker cost.",
      },
      {
        kind: "p",
        text:
          "Yet enforcement remains fragmented. Workers are quoted “service charges” for documentation, “pre-departure orientation”, language assessments, accommodation deposits and a long tail of euphemisms that, taken together, easily exceed the equivalent of a year’s net earnings in the destination market.",
      },
      {
        kind: "callout",
        title: "What the 2025 ILO corridor study found",
        text:
          "Median fee burden along West Africa → Gulf hospitality corridors: $2,800–$4,200 per worker. Median fee burden along East Africa → GCC care corridors: $1,700–$2,400. Less than 11% of workers surveyed reported receiving an itemised invoice for the fees they paid.",
      },
      { kind: "h2", text: "Why “free migration” often isn’t" },
      {
        kind: "p",
        text:
          "When pathway design pushes cost recovery onto the worker, three things happen, and all three undermine the long-term value the corridor is meant to create.",
      },
      {
        kind: "list",
        items: [
          "Workers arrive in debt, sometimes to family lenders charging effective rates of 40–120% APR. The first 6–12 months of earnings flow back to debt service, not to remittances or savings.",
          "Drop-out and absconding rates rise sharply in the first 90 days, because workers who feel trapped by debt make different employment decisions than workers who don’t.",
          "Employers pay more in the long run. The headline saving of a low-fee placement disappears as soon as you account for re-hiring, lost productivity and reputational risk from non-compliant subcontracted recruitment.",
        ],
      },
      { kind: "h2", text: "What changes when the model flips" },
      {
        kind: "p",
        text:
          "When an employer formally takes on the recruitment cost — not as a discretionary bonus but as a contractual baseline — the entire economic logic of the pathway changes. The worker arrives un-indebted and is therefore free to make the choices that produce good outcomes for everyone: stay in the role, learn, send money home, plan a return.",
      },
      {
        kind: "quote",
        text:
          "The first 90 days are where ethical recruitment is either real or imaginary. If a worker is in debt on day one, the model is broken, no matter what the brochure says.",
        attribution: "Programme Lead, INSPIRE AFRICA",
      },
      { kind: "h2", text: "What INSPIRE does differently" },
      {
        kind: "p",
        text:
          "The INSPIRE platform is built around a single non-negotiable: workers do not pay recruitment fees. Where structured migration finance is required to cover ancillary costs like visas, flights or initial accommodation, it is salary-linked, capped, transparent, and contracted separately — never bundled into an opaque “service charge”.",
      },
      {
        kind: "p",
        text:
          "That single design choice is what allows every other part of the pathway — readiness, matching, compliance, aftercare — to actually work. If the financial foundation is fair, the rest is engineering. If it isn’t, no amount of pre-departure training will fix the outcome.",
      },
    ],
  },
  {
    slug: "uk-care-visa-2026-what-african-workers-need-to-know",
    title: "UK care sector at breaking point: what 2026’s visa changes mean for African health workers",
    excerpt:
      "The 2026 Health and Care Worker visa changes have tightened the front door without fixing the staffing crisis behind it. We unpack what changed, who it affects, and why structured pathways now matter more than ever.",
    category: "Policy & Markets",
    author: "Editorial Desk",
    authorRole: "INSPIRE AFRICA",
    date: "2026-04-28",
    readMinutes: 8,
    heroImage: "/images/inspire-healthcare-team.jpg",
    heroAlt: "A team of African healthcare professionals smiling together",
    tags: ["United Kingdom", "Healthcare", "Visa policy", "NHS"],
    body: [
      {
        kind: "lede",
        text:
          "The UK’s adult social-care vacancy rate sits above 8.3% as we go to publication — the equivalent of roughly 130,000 unfilled posts on any given day. The Spring 2026 amendments to the Health and Care Worker visa were sold as a way to professionalise the route. What they’ve actually done is narrow it.",
      },
      { kind: "h2", text: "What the 2026 changes actually do" },
      {
        kind: "list",
        items: [
          "Raised the minimum hourly threshold for sponsorship in adult social care, bringing care workers closer to the general skilled-worker pay floor.",
          "Tightened sponsor licence conditions: care providers now face stricter scrutiny on accommodation arrangements, working-hours compliance and recruitment-fee declarations.",
          "Introduced a new requirement for sponsors to evidence local-recruitment efforts before issuing international Certificates of Sponsorship for entry-level care roles.",
          "Maintained the route’s exemption from the general work-visa salary increase — but only for genuine adult social-care roles, not for repackaged general care work.",
        ],
      },
      { kind: "h2", text: "Why this matters for African workers" },
      {
        kind: "p",
        text:
          "On paper, the route is still open. In practice, three things are filtering who actually gets through: documentary readiness, demonstrable English-language competence, and the credibility of the sponsoring employer. A candidate with a clean readiness profile from a structured pathway now clears these checks in days. A candidate sourced through an informal subagent often doesn’t clear them at all.",
      },
      {
        kind: "callout",
        title: "The under-reported story",
        text:
          "The 2026 changes are not pushing African workers out of the UK care sector. They are pushing out unstructured recruitment. Employers who could once tolerate hiring “whoever shows up” are now exposed to compliance penalties that make pre-screened, structured pipelines the only commercially rational choice.",
      },
      { kind: "h2", text: "What employers are learning the hard way" },
      {
        kind: "p",
        text:
          "Care groups that ran on a fragmented mix of agency hires, direct sponsorships and informal referrals are repricing their workforce strategy in 2026. The Home Office’s licence-revocation rate jumped sharply in Q1 — not because providers became less ethical overnight, but because the new compliance bar is harder to clear without a structured sourcing partner.",
      },
      {
        kind: "p",
        text:
          "The providers winning in this market are doing three things simultaneously: consolidating their sponsorship onto a smaller number of compliant recruitment partners; investing in pre-deployment readiness so the worker arrives able to perform from week one; and pricing aftercare into the contract, not bolting it on later.",
      },
      { kind: "h2", text: "What this looks like through the INSPIRE pipeline" },
      {
        kind: "p",
        text:
          "Candidates entering the UK care corridor through INSPIRE complete a multi-stage readiness assessment that mirrors what UK sponsors and the Home Office actually scrutinise: language proficiency to the required standard, documentation that maps to the current Certificate of Sponsorship format, sector-specific competency evidence, and a clear, traceable recruitment chain with no informal subcontracting.",
      },
      {
        kind: "p",
        text:
          "The result for the sponsor is a candidate who can be onboarded in days. The result for the worker is a route that holds up under scrutiny at every step — visa interview, port-of-entry, first-90-days probation — and produces a placement that actually lasts.",
      },
      {
        kind: "quote",
        text:
          "The market is finally rewarding what we’ve been building for years: structured pathways that hold up under inspection. The visa changes didn’t create that need. They just made it impossible to ignore.",
          attribution: "Senior Adviser, INSPIRE AFRICA",
      },
    ],
  },
  {
    slug: "from-remittance-to-reinvestment-earn-learn-return",
    title: "From remittance to reinvestment: why Earn-Learn-Return is Africa’s next growth story",
    excerpt:
      "African workers abroad now send home more than $100B a year — more than foreign aid and FDI combined. But remittances reach households, not economies. Circular migration is how that changes.",
    category: "Development Economics",
    author: "Editorial Desk",
    authorRole: "INSPIRE AFRICA",
    date: "2026-03-31",
    readMinutes: 9,
    heroImage: "/images/inspire-farmer-agriculture.jpg",
    heroAlt: "An African farmer in a field, symbolising returning skills and capital",
    tags: ["Remittances", "Circular migration", "Policy", "Economic development"],
    body: [
      {
        kind: "lede",
        text:
          "Remittances to Sub-Saharan Africa crossed $100 billion in 2025 — a number larger than total foreign direct investment and more than three times the value of official development assistance to the region. And yet, in most national budgets, this capital flow is treated as a footnote rather than a strategy.",
      },
      { kind: "h2", text: "The household ceiling on remittance value" },
      {
        kind: "p",
        text:
          "Remittances are by design household-level transfers. They fund school fees, medical bills, food security, modest home improvements. They are how families absorb shocks that the formal social-protection system doesn’t reach. They are not, in most cases, channelled into productive investment, skills accumulation or enterprise formation.",
      },
      {
        kind: "p",
        text:
          "That is not a moral failing of migrant families. It is a structural feature of unmanaged migration. When workers leave through informal channels, return without a plan, and reintegrate without support, the economic ceiling on what migration can do for the home economy is fundamentally capped.",
      },
      { kind: "h2", text: "What Earn-Learn-Return actually means" },
      {
        kind: "p",
        text:
          "Earn-Learn-Return is shorthand for an explicit, designed migration cycle in which each of the three stages produces a measurable outcome for the worker and for the country of origin:",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Earn — the worker accesses a higher-wage international labour market through a fair, structured pathway and, critically, captures more of that wage than they would under a fee-charging model.",
          "Learn — the placement is treated as a skills-development stage, not just a transactional job, with formal recognition of capability acquired (sector qualifications, language, supervisory experience).",
          "Return — the return is anticipated, supported and connected to a reintegration pathway: small-business credit, employer matching, public-sector re-entry, or onward placement.",
        ],
      },
      {
        kind: "callout",
        title: "The numbers governments tend to miss",
        text:
          "Pilot Earn-Learn-Return cohorts tracked across two East African corridors over 2023–2025 produced a 2.1× multiplier on per-worker reinvestment versus matched control groups of unstructured migrants. The difference wasn’t in how much was earned abroad — it was in how much returned as productive capital instead of consumption-only remittances.",
      },
      { kind: "h2", text: "Why governments are starting to pay attention" },
      {
        kind: "p",
        text:
          "Three trends are converging in 2026 that make this more than a policy think-piece. First, destination countries are tightening the rules on informal recruitment, which means governments of origin can no longer pretend that unmanaged migration is a costless externality. Second, the demographic case for managed African mobility is now mainstream in destination capitals — the conversation has shifted from “whether” to “how”. Third, the data infrastructure to actually track outcomes — not just departures and arrivals — has matured enough that bilateral agreements can be designed against measurable targets.",
      },
      {
        kind: "quote",
        text:
          "If a country knows precisely how many of its workers are abroad, in what sectors, on what terms, and what they’re bringing back, it can make migration part of national development planning. If it doesn’t, it can’t.",
        attribution: "Partner government adviser",
      },
      { kind: "h2", text: "What this looks like in the INSPIRE model" },
      {
        kind: "p",
        text:
          "INSPIRE AFRICA is built as the infrastructure for governed circular migration: corridor design with destination employers, worker readiness and protection, ethical financing where needed, and — the part most platforms quietly skip — return and reintegration as a first-class stage of the journey, not an afterthought.",
      },
      {
        kind: "p",
        text:
          "The argument for governments is straightforward: every cohort that moves through a governed pathway returns more value to the origin economy than the same cohort moving informally. The case for workers is also straightforward: a designed return is the difference between a placement that pays off for a decade and one that pays off for a year.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, count = 2): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, count);
}

/** Locale-stable display date, e.g. "12 May 2026" */
export function formatBlogDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
