import { Check, FileText, GitBranch, Layers, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import Surface from "../shared/ui/Surface";
import MarketingLayout from "./MarketingLayout";
import styles from "./MarketingPage.module.css";

const ROADMAP_ITEMS = [
  {
    title: "Declaration draft builder",
    status: "Template-ready",
    icon: <FileText size={15} />,
    text: "Draft a structured conformity-document starter from the route already returned by the analyzer.",
  },
  {
    title: "Evidence and gap engine",
    status: "Roadmap",
    icon: <GitBranch size={15} />,
    text: "Summarize likely evidence gaps, expected documents, and handoff-ready next actions after scoping.",
  },
  {
    title: "Standards map",
    status: "Expanding",
    icon: <Layers size={15} />,
    text: "Browse directive families and route patterns without running a full product-specific analysis first.",
  },
  {
    title: "Cyber route preview",
    status: "Evolving",
    icon: <Wifi size={15} />,
    text: "Focus specifically on connected-product obligations and the overlap between RED cybersecurity and CRA review.",
  },
];

export default function ToolsPage() {
  return (
    <MarketingLayout
      meta={{
        title: "Roadmap Modules",
        description:
          "Supporting RuleGrid roadmap modules that extend the analyzer without displacing it as the primary product surface.",
        canonicalPath: "/tools",
      }}
      actions={
        <Link to="/analyze" className={styles.buttonSecondary}>
          Open analyzer
        </Link>
      }
    >
      <Surface bodyClassName={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>Supporting modules</span>
          <h1 className={styles.heroTitle}>The analyzer stays primary. These modules extend it.</h1>
          <p className={styles.heroText}>
            The live analyzer remains the main product surface. The items below show the supporting
            capabilities being shaped around that workflow rather than replacing it.
          </p>
          <div className={styles.heroActions}>
            <Link to="/analyze" className={styles.buttonPrimary}>
              Use the live analyzer
            </Link>
            <Link to="/contact" className={styles.buttonGhost}>
              Share requirements
            </Link>
          </div>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.miniStat}>
            <span className={styles.miniStatValue}>Live today</span>
            <p className={styles.miniStatLabel}>
              Directive families, standards route, parallel obligations, and clarification prompts.
            </p>
          </div>
        </div>
      </Surface>

      <Surface
        eyebrow="Current product"
        title="What the live analyzer already returns"
        text="Use the analyzer as the main operational path; everything else is designed to support the same route data."
      >
        <div className={styles.chipRow}>
          {[
            "Applicable directive families",
            "Standards route by regime",
            "Parallel obligations",
            "Re-runnable clarification workflow",
          ].map((item) => (
            <span key={item} className={styles.chip}>
              <Check size={12} />
              {item}
            </span>
          ))}
        </div>
      </Surface>

      <Surface
        eyebrow="Roadmap"
        title="Modules around the core workflow"
        text="These are supporting layers around the same analyzer-first product surface."
      >
        <div className={styles.toolsGrid}>
          {ROADMAP_ITEMS.map((item) => (
            <div key={item.title} className={styles.toolCard}>
              <div className={styles.toolCardMeta}>
                <div className={styles.iconRow}>
                  {item.icon}
                  <span className={styles.smallLabel}>Module</span>
                </div>
                <span className={styles.roadmapTag}>{item.status}</span>
              </div>
              <div className={styles.cardTitle}>{item.title}</div>
              <p className={styles.cardText}>{item.text}</p>
            </div>
          ))}
        </div>
      </Surface>
    </MarketingLayout>
  );
}
