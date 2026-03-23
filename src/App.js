import { useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { ListChecks, Sparkles } from "lucide-react";
import AnalyzeWorkspace from "./AnalyzeWorkspace";
import "./App.css";

function PrimaryNav() {
  const items = [
    { to: "/", label: "Home", end: true },
    { to: "/analyze", label: "Analyze" },
    { to: "/tools", label: "Tools" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="primary-nav" aria-label="Primary">
      {items.map((item) => (
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
              <img src="/logo512.png" alt="RuleGrid" className="brand__logo" />
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

function ShellPage({ children, cta }) {
  return (
    <div className="app-shell">
      <SiteHeader>{cta}</SiteHeader>
      <main className="page-shell page-main page-main--marketing">{children}</main>
    </div>
  );
}

function MarketingHero() {
  return (
    <section className="marketing-hero">
      <div className="marketing-hero__grid">
        <div className="marketing-hero__copy">
          <span className="marketing-eyebrow">Compliance scoping workspace</span>
          <h1 className="marketing-hero__title">
            Turn product descriptions into a structured EU compliance starting point.
          </h1>
          <p className="marketing-hero__text">
            RuleGrid helps teams identify likely directives, route families, harmonized standards
            and adjacent obligations early, before a full expert review starts.
          </p>

          <div className="marketing-hero__actions">
            <Link to="/analyze" className="button button--primary marketing-hero__btn">
              <Sparkles size={14} />
              Open analyzer
            </Link>
            <Link to="/tools" className="button button--secondary marketing-hero__btn">
              <ListChecks size={14} />
              Explore tools
            </Link>
          </div>

          <div className="marketing-stats">
            <div className="marketing-stat">
              <div className="marketing-stat__value">Faster triage</div>
              <div className="marketing-stat__label">Product, directive and standards route in one pass</div>
            </div>
            <div className="marketing-stat">
              <div className="marketing-stat__value">Scope-first</div>
              <div className="marketing-stat__label">Clarifies power, radios, cloud, materials and use-case signals</div>
            </div>
            <div className="marketing-stat">
              <div className="marketing-stat__value">Team-ready</div>
              <div className="marketing-stat__label">Useful for RA, engineering, sourcing and consultant handovers</div>
            </div>
          </div>
        </div>

        <div className="marketing-hero__panel">
          <div className="marketing-card">
            <div className="marketing-card__eyebrow">What the analyzer produces</div>
            <ul className="marketing-list">
              <li>Primary standards route by directive family</li>
              <li>Parallel obligations such as RoHS, REACH, Battery, WEEE or FCM</li>
              <li>Clarification prompts for missing scope-changing inputs</li>
              <li>Compact output for internal review and consultant briefing</li>
            </ul>
          </div>
          <div className="marketing-card">
            <div className="marketing-card__eyebrow">Good example input</div>
            <p className="marketing-card__text">
              “Wi-Fi connected robot vacuum with charging dock, Li-ion battery, mobile app,
              OTA firmware updates, cloud account and voice assistant support.”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Start analysis
        </Link>
      }
    >
      <MarketingHero />

      <section className="marketing-section-grid">
        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">What RuleGrid is for</div>
              <h2 className="panel__title">A practical first-pass scoping layer</h2>
              <p className="panel__subtitle">
                Use it as a structured intake tool, not as the final legal conclusion.
              </p>
            </div>
          </div>
          <div className="marketing-columns">
            <div className="marketing-card marketing-card--soft">
              <div className="marketing-card__title">Early product intake</div>
              <p className="marketing-card__text">
                Turn messy descriptions into a cleaner route before engineering and compliance teams go deep.
              </p>
            </div>
            <div className="marketing-card marketing-card--soft">
              <div className="marketing-card__title">Internal alignment</div>
              <p className="marketing-card__text">
                Give sourcing, product and RA teams the same starting picture of applicable frameworks.
              </p>
            </div>
            <div className="marketing-card marketing-card--soft">
              <div className="marketing-card__title">Consultant handoff</div>
              <p className="marketing-card__text">
                Use the structured output as a briefing draft for labs, notified bodies or external experts.
              </p>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Navigation</div>
              <h2 className="panel__title">Direct routes for the main product pages</h2>
              <p className="panel__subtitle">The site now has real top-level URLs that can be shared.</p>
            </div>
          </div>
          <div className="quick-link-grid">
            <Link to="/analyze" className="route-link-card">
              <div className="route-link-card__title">Analyzer</div>
              <div className="route-link-card__text">Run a product description and inspect the route.</div>
            </Link>
            <Link to="/tools" className="route-link-card">
              <div className="route-link-card__title">Tools</div>
              <div className="route-link-card__text">See the modules and roadmap blocks around the core engine.</div>
            </Link>
            <Link to="/about" className="route-link-card">
              <div className="route-link-card__title">About</div>
              <div className="route-link-card__text">Read the intended use, workflow and positioning.</div>
            </Link>
            <Link to="/contact" className="route-link-card">
              <div className="route-link-card__title">Contact</div>
              <div className="route-link-card__text">Use the built-in form template to draft an inquiry.</div>
            </Link>
          </div>
        </div>
      </section>
    </ShellPage>
  );
}

function ToolsPage() {
  const tools = [
    {
      title: "Live analyzer",
      status: "Available now",
      text: "Current production workspace for first-pass scoping from natural-language product descriptions.",
      cta: { to: "/analyze", label: "Open analyzer" },
    },
    {
      title: "Declaration draft builder",
      status: "Template-ready",
      text: "Planned module to convert identified legislation and standards into a draft EU DoC starter.",
      cta: { to: "/contact", label: "Request priority" },
    },
    {
      title: "Evidence & gap engine",
      status: "Roadmap focus",
      text: "Planned layer for typical documents, expected reports, missing inputs and blocker-level evidence gaps.",
      cta: { to: "/about", label: "Read workflow" },
    },
    {
      title: "Consultant handoff pack",
      status: "Concept ready",
      text: "Structured export block for sharing product context, assumptions and identified routes with external experts.",
      cta: { to: "/contact", label: "Discuss use case" },
    },
    {
      title: "Standards map",
      status: "Expanding",
      text: "Directory-style route explorer for major directive families, showing primary standards and linked obligations.",
      cta: { to: "/analyze", label: "Use current route" },
    },
    {
      title: "Cyber route preview",
      status: "Evolving",
      text: "Focused workspace for RED cyber, CRA and connected-product clarification pathways.",
      cta: { to: "/contact", label: "Share requirements" },
    },
  ];

  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Open analyzer
        </Link>
      }
    >
      <section className="simple-hero">
        <span className="marketing-eyebrow">Tool stack</span>
        <h1 className="simple-hero__title">Beyond the main analysis page</h1>
        <p className="simple-hero__text">
          These are the product surfaces around the core scoping engine. Some are live now, others are structured placeholders you can refine next.
        </p>
      </section>

      <div className="tools-grid">
        {tools.map((tool) => (
          <div key={tool.title} className="panel tool-card">
            <div className="panel__header">
              <div>
                <div className="eyebrow">{tool.status}</div>
                <h2 className="panel__title">{tool.title}</h2>
                <p className="panel__subtitle">{tool.text}</p>
              </div>
              <Link to={tool.cta.to} className="button button--secondary">
                {tool.cta.label}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </ShellPage>
  );
}

function AboutPage() {
  return (
    <ShellPage
      cta={
        <Link to="/analyze" className="button button--secondary topbar__action-btn">
          Try analyzer
        </Link>
      }
    >
      <section className="simple-hero">
        <span className="marketing-eyebrow">About RuleGrid</span>
        <h1 className="simple-hero__title">A first-pass compliance scoping system</h1>
        <p className="simple-hero__text">
          RuleGrid is designed to help teams move from rough product descriptions to a more structured compliance review path. It is best used at intake, concept, sourcing and consultant-briefing stages.
        </p>
      </section>

      <div className="marketing-section-grid">
        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">How it should be used</div>
              <h2 className="panel__title">Best fit for the current product form</h2>
            </div>
          </div>
          <ul className="marketing-list">
            <li>Early screening of consumer and connected products</li>
            <li>Identifying likely directive families and standards routes</li>
            <li>Surfacing missing details that materially change scope</li>
            <li>Preparing a cleaner internal or external compliance discussion</li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">What it is not</div>
              <h2 className="panel__title">Important expectation-setting</h2>
            </div>
          </div>
          <ul className="marketing-list">
            <li>Not a substitute for legal advice or accredited testing</li>
            <li>Not the final statement of conformity</li>
            <li>Not a guarantee that every national or sector rule has been captured</li>
            <li>Not a replacement for product-specific technical review</li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Suggested workflow</div>
              <h2 className="panel__title">A practical usage pattern</h2>
            </div>
          </div>
          <div className="workflow-list">
            <div className="workflow-item"><span>1</span><p>Describe the product with real power, radio, software, materials and use-case details.</p></div>
            <div className="workflow-item"><span>2</span><p>Review the returned standards route and parallel obligations.</p></div>
            <div className="workflow-item"><span>3</span><p>Add missing clarifications and re-run until the route stabilizes.</p></div>
            <div className="workflow-item"><span>4</span><p>Use the result as a briefing draft for expert review, testing or documentation work.</p></div>
          </div>
        </div>
      </div>
    </ShellPage>
  );
}

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
      <section className="simple-hero">
        <span className="marketing-eyebrow">Contact & consulting</span>
        <h1 className="simple-hero__title">Start a discussion around your workflow</h1>
        <p className="simple-hero__text">
          This page is a real route with a working input form template. You can later connect it to a backend form service or CRM.
        </p>
      </section>

      <div className="contact-layout">
        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">Contact</div>
              <h2 className="panel__title">Prepare an inquiry</h2>
              <p className="panel__subtitle">Use this template form to prepare a demo request, consulting discussion or product feedback message.</p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__grid">
              <label className="field">
                <span>Name</span>
                <input name="name" value={form.name} onChange={onChange} placeholder="Your name" required />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@company.com" required />
              </label>
              <label className="field">
                <span>Company</span>
                <input name="company" value={form.company} onChange={onChange} placeholder="Company or team" />
              </label>
              <label className="field">
                <span>Topic</span>
                <select name="topic" value={form.topic} onChange={onChange}>
                  <option>Consultation request</option>
                  <option>Demo request</option>
                  <option>Tool feedback</option>
                  <option>Partnership inquiry</option>
                  <option>Custom workflow discussion</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Message</span>
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                rows={7}
                placeholder="Tell us what product type, team problem or workflow you want help with."
                required
              />
            </label>

            <div className="contact-form__actions">
              <button type="submit" className="button button--primary">
                <Sparkles size={14} />
                Open email draft
              </button>
              <a className="button button--secondary" href="mailto:hello@rulegrid.net">
                Direct email
              </a>
            </div>

            {submitted ? (
              <div className="contact-form__success">
                Your email app should open with the drafted inquiry. Replace the address with your final business email if needed.
              </div>
            ) : null}
          </form>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <div className="eyebrow">What to include</div>
              <h2 className="panel__title">Helpful details for a strong first review</h2>
            </div>
          </div>
          <ul className="marketing-list">
            <li>Product category and target market</li>
            <li>Power architecture, radios and cloud/app dependencies</li>
            <li>Expected launch timing and certification path</li>
            <li>Main blocker, uncertainty or consultant need</li>
          </ul>
        </div>
      </div>
    </ShellPage>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/analyze" element={<AnalyzeWorkspace />} />
      <Route path="/tools" element={<ToolsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
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
