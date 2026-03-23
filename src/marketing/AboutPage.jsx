import { Link } from "react-router-dom";
import Surface from "../shared/ui/Surface";
import MarketingLayout from "./MarketingLayout";
import styles from "./MarketingPage.module.css";

const FIT_LIST = [
  "Concept and intake-stage consumer or connected products",
  "Internal route triage before deeper expert review begins",
  "Clarifying the impact of radios, software, cloud, or material details",
  "Creating a better handoff baseline for labs or consultants",
];

const LIMIT_LIST = [
  "Formal conformity assessment and accredited testing",
  "Final legal or certification decisions",
  "A substitute for product-specific specialist judgment",
  "A guarantee that every Member State nuance is captured",
];

const WORKFLOW = [
  {
    n: "1",
    title: "Bring real product detail",
    text: "Even imperfect descriptions improve quickly if they include the core function, power, radios, and software dependencies.",
  },
  {
    n: "2",
    title: "Interrogate the first route",
    text: "Use the initial result as a working hypothesis and challenge it against your own engineering and sourcing facts.",
  },
  {
    n: "3",
    title: "Close the gaps that matter",
    text: "Apply clarifications and re-run when the product description still leaves scope-changing uncertainty.",
  },
  {
    n: "4",
    title: "Escalate with context",
    text: "Move into expert review with a tighter route summary, clearer unknowns, and fewer repeated discovery questions.",
  },
];

export default function AboutPage() {
  return (
    <MarketingLayout
      meta={{
        title: "About RuleGrid",
        description:
          "Where RuleGrid fits in a compliance-team workflow and where formal expert review still takes over.",
        canonicalPath: "/about",
      }}
      actions={
        <Link to="/analyze" className={styles.buttonSecondary}>
          Try analyzer
        </Link>
      }
    >
      <Surface bodyClassName={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>Confidence and boundaries</span>
          <h1 className={styles.heroTitle}>
            A first-pass scoping system for teams, not a replacement for experts.
          </h1>
          <p className={styles.heroText}>
            RuleGrid is strongest when it helps compliance, engineering, and sourcing teams create a
            clearer first route and a better handoff package before specialist review becomes the bottleneck.
          </p>
          <div className={styles.heroActions}>
            <Link to="/analyze" className={styles.buttonPrimary}>
              Open analyzer
            </Link>
            <Link to="/contact" className={styles.buttonGhost}>
              Discuss workflow
            </Link>
          </div>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.miniStat}>
            <span className={styles.miniStatValue}>Use it to sharpen scope</span>
            <p className={styles.miniStatLabel}>
              The objective is route clarity, higher-quality questions, and a stronger review starting point.
            </p>
          </div>
        </div>
      </Surface>

      <div className={styles.twoCol}>
        <Surface eyebrow="Designed for" title="Where it fits">
          <ul className={styles.accentList}>
            {FIT_LIST.map((item) => (
              <li key={item} className={styles.accentListItem}>
                <span className={styles.accentDot} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface eyebrow="Still required" title="Where formal review takes over">
          <ul className={styles.accentList}>
            {LIMIT_LIST.map((item) => (
              <li key={item} className={styles.accentListItem}>
                <span className={`${styles.accentDot} ${styles.mutedDot}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <Surface
        eyebrow="Recommended workflow"
        title="How compliance teams get the most from it"
        text="Use the analyzer as a structured intake and iteration layer before the external conformity path."
      >
        <div className={styles.stepGrid}>
          {WORKFLOW.map((item) => (
            <div key={item.n} className={styles.stepCard}>
              <div className={styles.stepNumber}>{item.n}</div>
              <div className={styles.stepTitle}>{item.title}</div>
              <p className={styles.stepText}>{item.text}</p>
            </div>
          ))}
        </div>
      </Surface>
    </MarketingLayout>
  );
}
