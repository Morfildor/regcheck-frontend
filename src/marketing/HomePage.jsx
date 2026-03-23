import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SECONDARY_ROUTE_LINKS } from "../app/navigation";
import Surface from "../shared/ui/Surface";
import MarketingLayout from "./MarketingLayout";
import styles from "./MarketingPage.module.css";

const TRUST_METRICS = [
  {
    label: "Primary output",
    value: "Standards route",
    text: "Grouped by directive family with supporting legislation context.",
  },
  {
    label: "Input style",
    value: "Plain language",
    text: "Built for intake-stage product descriptions, not perfect spec sheets.",
  },
  {
    label: "Team fit",
    value: "RA + engineering",
    text: "Useful for compliance, sourcing, and consultant handoff conversations.",
  },
];

const FEATURE_CARDS = [
  {
    title: "Start with uncertain product detail",
    text: "The analyzer is designed for the moment when product data is incomplete but decisions already need a route, a risk level, and the next questions.",
  },
  {
    title: "Challenge scope before cost accumulates",
    text: "Power architecture, radio functions, software dependencies, and material contact all move the route. RuleGrid surfaces those pressure points early.",
  },
  {
    title: "Brief experts from a cleaner baseline",
    text: "The goal is not to replace labs or consultants. It is to give them a sharper starting brief and reduce circular scoping work.",
  },
];

const WORKFLOW_STEPS = [
  {
    n: "1",
    title: "Describe the product",
    text: "Include function, power source, radios, companion software, and any food or user-contact materials.",
  },
  {
    n: "2",
    title: "Review the first route",
    text: "Check the returned directive families, standards path, and parallel obligations against your product knowledge.",
  },
  {
    n: "3",
    title: "Apply clarifications",
    text: "Use the missing-information prompts to close gaps that could change the route or risk level.",
  },
  {
    n: "4",
    title: "Re-run and hand off",
    text: "Use the tighter output as a handoff baseline for internal reviewers, labs, or external advisors.",
  },
];

const LIMITS = [
  "Not a legal opinion or certification decision",
  "Not a replacement for accredited testing",
  "Not a guarantee that every national or sector rule has been captured",
];

export default function HomePage() {
  return (
    <MarketingLayout
      meta={{
        title: "RuleGrid",
        description:
          "Analyzer-first EU regulatory scoping for compliance teams working through early product uncertainty.",
        canonicalPath: "/",
      }}
      actions={
        <Link to="/analyze" className={styles.buttonSecondary}>
          Open analyzer
        </Link>
      }
    >
      <Surface bodyClassName={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>Analyzer-first workflow</span>
          <h1 className={styles.heroTitle}>
            Move from rough product detail to a defensible EU starting route.
          </h1>
          <p className={styles.heroText}>
            RuleGrid is built for compliance, engineering, and sourcing teams that need a strong
            first-pass view of directives, standards, and parallel obligations before formal review
            begins.
          </p>
          <div className={styles.heroActions}>
            <Link to="/analyze" className={styles.buttonPrimary}>
              <Sparkles size={15} />
              Analyze a product
            </Link>
            <Link to="/about" className={styles.buttonGhost}>
              Where it fits
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.miniStat}>
            <span className={styles.miniStatValue}>Directives, standards, obligations</span>
            <p className={styles.miniStatLabel}>
              One workspace that prioritizes the route itself and the clarification prompts that
              most change it.
            </p>
          </div>
          <div className={styles.miniStat}>
            <span className={styles.miniStatValue}>Built for repeat use</span>
            <p className={styles.miniStatLabel}>
              Refine the same description, re-run, and carry the latest route forward without
              hunting through separate tools.
            </p>
          </div>
        </div>
      </Surface>

      <div className={styles.trustGrid}>
        {TRUST_METRICS.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricValue}>{metric.value}</span>
            <p className={styles.cardText}>{metric.text}</p>
          </div>
        ))}
      </div>

      <Surface
        eyebrow="What the analyzer does well"
        title="A practical first-pass scoping layer"
        text="The product is optimized for early-stage route clarity and team alignment, not for replacing formal conformity work."
      >
        <div className={styles.featureGrid}>
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className={styles.featureCard}>
              <div className={styles.iconRow}>
                <ShieldCheck size={15} />
                <span className={styles.smallLabel}>Compliance-first</span>
              </div>
              <div className={styles.cardTitle}>{card.title}</div>
              <p className={styles.cardText}>{card.text}</p>
            </div>
          ))}
        </div>
      </Surface>

      <Surface
        eyebrow="How to use it"
        title="A cleaner flow from intake to expert review"
        text="The analyzer is strongest when it sharpens internal discussion before the external conformity path becomes expensive."
      >
        <div className={styles.stepGrid}>
          {WORKFLOW_STEPS.map((step) => (
            <div key={step.n} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.n}</div>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </Surface>

      <div className={styles.twoCol}>
        <Surface eyebrow="Expected returns" title="What you get back">
          <div className={styles.chipRow}>
            {[
              "Applicable directive families",
              "Primary harmonized standards route",
              "Parallel obligations",
              "Scope-changing clarification prompts",
            ].map((item) => (
              <span key={item} className={styles.chip}>
                <Check size={12} />
                {item}
              </span>
            ))}
          </div>
        </Surface>

        <Surface eyebrow="Important boundary" title="What RuleGrid does not replace">
          <ul className={styles.accentList}>
            {LIMITS.map((item) => (
              <li key={item} className={styles.accentListItem}>
                <span className={`${styles.accentDot} ${styles.mutedDot}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <Surface
        eyebrow="Secondary route"
        title="Roadmap modules stay available, but the analyzer is the product core"
        text="The supporting tool surface remains live for compatibility, while the analyzer stays the primary product path."
      >
        <div className={styles.buttonRow}>
          <Link to={SECONDARY_ROUTE_LINKS[0].to} className={styles.textLink}>
            {SECONDARY_ROUTE_LINKS[0].label}
            <ArrowRight size={14} />
          </Link>
          <Link to="/contact" className={styles.textLink}>
            Talk to the team
            <ArrowRight size={14} />
          </Link>
        </div>
      </Surface>
    </MarketingLayout>
  );
}
