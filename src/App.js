import { useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import {
  ArrowRight,
  Check,
  FileText,
  GitBranch,
  Layers,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import AnalyzeWorkspace from "./AnalyzeWorkspace";
import "./App.css";

/* ── Shared nav list ────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/",        label: "Home",    end: true },
  { to: "/analyze", label: "Analyze" },
  { to: "/tools",   label: "Tools"   },
  { to: "/about",   label: "About"   },
  { to: "/contact", label: "Contact" },
];

function PrimaryNav() {
  return (
    <nav className="primary-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `primary-nav__link ${isActive ? "primary-nav__link--active" : ""}`.trim()
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function SiteHeader({ children }) {
  return (
    <header className="topbar">
      <div className="page-shell topbar__inner topbar__inner--site">
        <div className="topbar__left">
          <Link to="/" className="brand brand--link" aria-label="RuleGrid home">
            <div className="brand__mark">
              <img src={`${process.env.PUBLIC_URL}/logo512.png`} alt="RuleGrid" className="brand__logo" />
            </div>
            <div>
              <div className="brand__title">RuleGrid</div>
              <div className="brand__subtitle">EU regulatory scoping</div>
            </div>
          </Link>
          <PrimaryNav />
        </div>
        <div className="topbar__meta">{children}</div>
      </div>
    </header>
  );
}

/* ── Shell wrapper shared by all marketing pages ────────────── */
function ShellPage({ children, cta }) {
  return (
    <div className="app-shell">
      <SiteHeader>{cta}</SiteHeader>
      <main className="page-shell page-main page-main--marketing">{children}</main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Shared micro-components
   ────────────────────────────────────────────────────────────── */

/* Reusable inner-page hero strip */
function InnerHero({ eyebrow, title, text }) {
  return (
    <section className="v2-inner-hero">
      <span className="marketing-eyebrow">{eyebrow}</span>
      <h1 className="v2-inner-hero__title">{title}</h1>
      {text && <p className="v2-inner-hero__text">{text}</p>}
    </section>
  );
}

/* Reusable icon-row list item */
function IconItem({ variant = "green", children }) {
  return (
    <div className="v2-icon-item">
      <div className={`v2-icon-item__dot v2-icon-item__dot--${variant}`}>
        {variant === "green" ? <Check size={9} /> : <ShieldCheck size={9} />}
      </div>
      <span>{children}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Home page  (/v2)
   ────────────────────────────────────────────────────────────── */
const HOME_STEPS = [
  {
    n: "1",
    title: "Describe your product",
    text: "Include power, radios, software stack, materials, intended use and target market for best results.",
  },
  {
    n: "2",
    title: "Review the route",
    text: "Inspect the returned directive families, standards route and parallel obligations.",
  },
  {
    n: "3",
    title: "Refine and re-run",
    text: "Apply clarification prompts and re-run until the compliance route stabilises.",
  },
  {
    n: "4",
    title: "Hand off with context",
    text: "Use the structured output as a briefing starting point for labs, notified bodies or consultants.",
  },
];

function HomePage() {
  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Start analysis
        </Link>
      }
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="v2-home-hero">
        <div className="v2-home-hero__copy">
          <span className="marketing-eyebrow">Compliance scoping workspace</span>
          <h1 className="v2-home-hero__title">
            From product description to EU compliance starting&nbsp;point.
          </h1>
          <p className="v2-home-hero__text">
            RuleGrid identifies applicable directives, standards routes and parallel obligations
            from a plain-language description — before formal expert review starts.
          </p>
          <div className="v2-home-hero__actions">
            <Link to="/analyze" className="button button--primary">
              <Sparkles size={14} />
              Open analyzer
            </Link>
            <Link to="/about" className="button button--ghost">
              How it works
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="v2-preview-card">
          <div className="v2-preview-card__label">Analysis returns</div>
          <div className="v2-preview-card__items">
            {[
              "Applicable directive families",
              "Primary harmonized standards route",
              "Parallel obligations — RoHS, REACH, WEEE, Battery",
              "Clarification prompts for scope-changing gaps",
            ].map((item) => (
              <div key={item} className="v2-preview-item">
                <div className="v2-preview-item__check">
                  <Check size={9} />
                </div>
                {item}
              </div>
            ))}
          </div>
          <div className="v2-preview-card__example">
            <div className="v2-preview-card__example-label">Example input</div>
            <p className="v2-preview-card__example-text">
              "Wi-Fi connected robot vacuum with Li-ion battery, mobile app, OTA updates and
              voice assistant support."
            </p>
          </div>
        </div>
      </section>

      {/* ── Three feature cards ──────────────────────────────── */}
      <div className="v2-feature-grid">
        <div className="v2-feature-card">
          <div className="v2-feature-card__icon">
            <Zap size={16} />
          </div>
          <div className="v2-feature-card__title">Faster first triage</div>
          <p className="v2-feature-card__text">
            Turn a rough description into a structured compliance starting point in one pass —
            before engineering, sourcing or expert review goes deep.
          </p>
        </div>
        <div className="v2-feature-card">
          <div className="v2-feature-card__icon">
            <Target size={16} />
          </div>
          <div className="v2-feature-card__title">Scope-shaping signals</div>
          <p className="v2-feature-card__text">
            Power, radios, cloud, materials and use-case details all change the route. RuleGrid
            surfaces the questions that matter most — early.
          </p>
        </div>
        <div className="v2-feature-card">
          <div className="v2-feature-card__icon">
            <Users size={16} />
          </div>
          <div className="v2-feature-card__title">Team-ready output</div>
          <p className="v2-feature-card__text">
            RA, engineering, sourcing and consultants all start from the same structured
            picture — fewer repeated scoping conversations.
          </p>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────── */}
      <div className="panel">
        <div className="panel__header">
          <div className="panel__heading">
            <div className="panel__eyebrow">Workflow</div>
            <h2 className="panel__title">A practical scoping flow</h2>
            <p className="panel__subtitle">
              Four steps from rough product description to a useful compliance starting point.
            </p>
          </div>
        </div>
        <div className="panel__body">
          <div className="v2-steps">
            {HOME_STEPS.map(({ n, title, text }) => (
              <div key={n} className="v2-step">
                <div className="v2-step__num">{n}</div>
                <div className="v2-step__title">{title}</div>
                <p className="v2-step__text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellPage>
  );
}

/* ──────────────────────────────────────────────────────────────
   Tools page  (/tools)
   ────────────────────────────────────────────────────────────── */
const ROADMAP_TOOLS = [
  {
    id: "doc-builder",
    title: "Declaration draft builder",
    badge: "soon",
    badgeLabel: "Template-ready",
    icon: <FileText size={15} />,
    text: "Converts identified legislation and standards into a draft EU Declaration of Conformity starter to accelerate documentation work.",
    cta: { to: "/contact", label: "Request priority" },
  },
  {
    id: "gap-engine",
    title: "Evidence & gap engine",
    badge: "roadmap",
    badgeLabel: "Roadmap",
    icon: <GitBranch size={15} />,
    text: "Identifies typical technical documents, expected test reports and missing inputs that could block conformity assessment.",
    cta: { to: "/about", label: "See workflow" },
  },
  {
    id: "handoff-pack",
    title: "Consultant handoff pack",
    badge: "concept",
    badgeLabel: "Concept",
    icon: <Package size={15} />,
    text: "Structured export block for sharing product context, key assumptions and identified routes with external experts.",
    cta: { to: "/contact", label: "Discuss use case" },
  },
  {
    id: "standards-map",
    title: "Standards map",
    badge: "roadmap",
    badgeLabel: "Expanding",
    icon: <Layers size={15} />,
    text: "Directory-style route explorer for major directive families — primary standards and linked parallel obligations.",
    cta: { to: "/analyze", label: "Use live route" },
  },
  {
    id: "cyber-route",
    title: "Cyber route preview",
    badge: "roadmap",
    badgeLabel: "Evolving",
    icon: <Wifi size={15} />,
    text: "Focused workspace for RED cyber, Cyber Resilience Act and connected-product clarification pathways.",
    cta: { to: "/contact", label: "Share requirements" },
  },
];

function ToolsPage() {
  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Open analyzer
        </Link>
      }
    >
      <InnerHero
        eyebrow="Tool suite"
        title="The compliance workspace, and what's next"
        text="The live analyzer is the core product today. The modules below describe what is
              being built around it — some template-ready, others structured roadmap items."
      />

      {/* Featured live tool */}
      <div className="v2-featured-tool">
        <div className="v2-featured-tool__header">
          <div className="v2-featured-tool__header-copy">
            <span className="v2-badge v2-badge--live">Live now</span>
            <h2 className="v2-featured-tool__title">Live analyzer</h2>
            <p className="v2-featured-tool__text">
              The production workspace for first-pass compliance scoping. Describe any
              connected or consumer product in plain language — the engine returns a structured
              starting point covering directives, standards, parallel obligations and the scope
              questions that most change the route.
            </p>
          </div>
          <div className="v2-featured-tool__cta">
            <Link to="/analyze" className="button button--primary">
              <Sparkles size={14} />
              Open analyzer
            </Link>
          </div>
        </div>
        <div className="v2-featured-tool__tags">
          {[
            "Applicable directive families",
            "Primary standards route",
            "Parallel obligations",
            "Clarification prompts",
          ].map((tag) => (
            <span key={tag} className="v2-return-tag">
              <Check size={9} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Roadmap grid */}
      <div className="v2-tools-grid">
        {ROADMAP_TOOLS.map((tool) => (
          <div key={tool.id} className="v2-tool-card">
            <div className="v2-tool-card__head">
              <div className="v2-tool-card__icon">{tool.icon}</div>
              <span className={`v2-badge v2-badge--${tool.badge}`}>{tool.badgeLabel}</span>
            </div>
            <div className="v2-tool-card__title">{tool.title}</div>
            <p className="v2-tool-card__text">{tool.text}</p>
            <Link to={tool.cta.to} className="v2-tool-card__link">
              {tool.cta.label} <ArrowRight size={11} />
            </Link>
          </div>
        ))}
      </div>
    </ShellPage>
  );
}

/* ──────────────────────────────────────────────────────────────
   About page  (/about)
   ────────────────────────────────────────────────────────────── */
const ABOUT_STEPS = [
  {
    n: "1",
    title: "Start with real product detail",
    text: "Power source, radios, software stack, materials, use-case and target market all change the route significantly.",
  },
  {
    n: "2",
    title: "Inspect and challenge the output",
    text: "Review returned directives, standards and obligations against your own product knowledge. Look for gaps.",
  },
  {
    n: "3",
    title: "Apply clarifications, re-run",
    text: "Use the prompted clarifications to fill scope-changing gaps. Re-run until the route stabilises.",
  },
  {
    n: "4",
    title: "Use as a briefing start",
    text: "Hand the structured output to your lab, notified body or regulatory consultant as a first draft context document.",
  },
];

function AboutPage() {
  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Try analyzer
        </Link>
      }
    >
      <InnerHero
        eyebrow="About RuleGrid"
        title="A first-pass EU compliance scoping system"
        text="RuleGrid is designed to help teams move from rough product descriptions to a more
              structured compliance review path. It is best used at intake, concept, sourcing
              and consultant-briefing stages — not as a replacement for expert review."
      />

      {/* Fit / Not-fit two-col */}
      <div className="v2-about-grid">
        <div className="panel">
          <div className="panel__header">
            <div className="panel__heading">
              <div className="panel__eyebrow">Designed for</div>
              <h2 className="panel__title">Where it fits</h2>
            </div>
          </div>
          <div className="panel__body">
            <div className="v2-icon-list">
              <IconItem>Early screening of consumer and connected products</IconItem>
              <IconItem>Identifying likely directive families and standards routes</IconItem>
              <IconItem>Surfacing missing details that materially change scope</IconItem>
              <IconItem>Aligning RA, engineering and sourcing around a shared starting picture</IconItem>
              <IconItem>Preparing a cleaner brief for labs, notified bodies or consultants</IconItem>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div className="panel__heading">
              <div className="panel__eyebrow">Not a substitute for</div>
              <h2 className="panel__title">Important limits</h2>
            </div>
          </div>
          <div className="panel__body">
            <div className="v2-icon-list">
              <IconItem variant="muted">Legal or regulatory legal advice</IconItem>
              <IconItem variant="muted">Accredited testing or certification</IconItem>
              <IconItem variant="muted">The final declaration of conformity</IconItem>
              <IconItem variant="muted">Product-specific technical expert review</IconItem>
              <IconItem variant="muted">A guarantee every national or sector rule is captured</IconItem>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow panel */}
      <div className="panel">
        <div className="panel__header">
          <div className="panel__heading">
            <div className="panel__eyebrow">Suggested workflow</div>
            <h2 className="panel__title">Getting the most from each analysis</h2>
            <p className="panel__subtitle">
              RuleGrid works best as a structured intake and briefing layer — not the final word.
            </p>
          </div>
        </div>
        <div className="panel__body">
          <div className="v2-steps">
            {ABOUT_STEPS.map(({ n, title, text }) => (
              <div key={n} className="v2-step">
                <div className="v2-step__num">{n}</div>
                <div className="v2-step__title">{title}</div>
                <p className="v2-step__text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellPage>
  );
}

/* ──────────────────────────────────────────────────────────────
   Contact page  (/contact)
   ────────────────────────────────────────────────────────────── */
const CONTACT_TOPICS = [
  "Consultation request",
  "Demo request",
  "Tool feedback",
  "Partnership inquiry",
  "Custom workflow discussion",
];

const WHAT_TO_INCLUDE = [
  "Product category and target market",
  "Power architecture, radios and cloud dependencies",
  "Expected launch timing and certification path",
  "Main blocker, uncertainty or consultant need",
];

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    topic: "Consultation request",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`[RuleGrid] ${form.topic}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:hello@rulegrid.net?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Open analyzer
        </Link>
      }
    >
      <InnerHero
        eyebrow="Contact &amp; consulting"
        title="Start a discussion around your workflow"
        text="Use the form below to prepare a demo request, consulting enquiry or product feedback. Clicking &ldquo;Open email draft&rdquo; composes the message in your email client."
      />

      <div className="v2-contact-grid">
        {/* ── Left: form ──────────────────────────────────── */}
        <div className="panel">
          <div className="panel__header">
            <div className="panel__heading">
              <div className="panel__eyebrow">Inquiry form</div>
              <h2 className="panel__title">Prepare your message</h2>
            </div>
          </div>
          <div className="panel__body">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="you@company.com"
                    required
                  />
                </label>
                <label className="field">
                  <span>Company</span>
                  <input
                    name="company"
                    value={form.company}
                    onChange={onChange}
                    placeholder="Company or team"
                  />
                </label>
                <label className="field">
                  <span>Topic</span>
                  <select name="topic" value={form.topic} onChange={onChange}>
                    {CONTACT_TOPICS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Message</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  rows={6}
                  placeholder="Tell us what product type, team problem or workflow you want help with."
                  required
                />
              </label>

              <div className="contact-form__actions">
                <button type="submit" className="button button--primary">
                  <Mail size={14} />
                  Open email draft
                </button>
                <a className="button button--secondary" href="mailto:hello@rulegrid.net">
                  Direct email
                </a>
              </div>

              {submitted && (
                <div className="contact-form__success">
                  Your email app should open with the drafted inquiry. Send it when you're
                  ready — or replace the address with your business email if needed.
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── Right: info ─────────────────────────────────── */}
        <div className="v2-contact-aside">
          <div className="panel">
            <div className="panel__header">
              <div className="panel__heading">
                <div className="panel__eyebrow">Direct contact</div>
                <h2 className="panel__title">Email us</h2>
              </div>
            </div>
            <div className="panel__body">
              <div className="v2-email-card">
                <div className="v2-email-card__icon">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="v2-email-card__label">Email</div>
                  <a
                    href="mailto:hello@rulegrid.net"
                    className="v2-email-card__value"
                  >
                    hello@rulegrid.net
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <div className="panel__heading">
                <div className="panel__eyebrow">What to include</div>
                <h2 className="panel__title">For a strong first reply</h2>
              </div>
            </div>
            <div className="panel__body">
              <div className="v2-icon-list">
                {WHAT_TO_INCLUDE.map((item) => (
                  <IconItem key={item}>{item}</IconItem>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShellPage>
  );
}

function NotFoundPage() {
  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Open analyzer
        </Link>
      }
    >
      <section className="v2-inner-hero">
        <span className="marketing-eyebrow">Page not found</span>
        <h1 className="v2-inner-hero__title">This page does not exist.</h1>
        <p className="v2-inner-hero__text">Use the main navigation or go straight back to the analyzer.</p>
      </section>
      <div className="v2-home-hero__actions">
        <Link to="/" className="button button--ghost">Back home</Link>
        <Link to="/analyze" className="button button--primary">Open analyzer</Link>
      </div>
    </ShellPage>
  );
}

/* ──────────────────────────────────────────────────────────────
   Router
   ────────────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<HomePage />}         />
      <Route path="/analyze" element={<AnalyzeWorkspace />} />
      <Route path="/tools"   element={<ToolsPage />}        />
      <Route path="/about"   element={<AboutPage />}        />
      <Route path="/contact" element={<ContactPage />}      />
      <Route path="*"        element={<NotFoundPage />}     />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}