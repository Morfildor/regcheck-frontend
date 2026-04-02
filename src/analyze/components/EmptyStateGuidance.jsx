import { Search, Waypoints } from "lucide-react";
import { titleCaseMinor } from "../helpers";
import { CompactList } from "./Pills";
import styles from "./EmptyStateGuidance.module.css";

const EXAMPLE_DETAILS = [
  "power source",
  "connectivity",
  "battery",
  "intended use",
  "included accessories",
  "environment / installation context",
];

export default function EmptyStateGuidance({ hasError }) {
  const sections = [
    {
      key: "helps",
      icon: Search,
      label: "What helps most",
      items: EXAMPLE_DETAILS.map((item) => titleCaseMinor(item)),
    },
    {
      key: "returns",
      icon: Waypoints,
      label: "The analyzer returns",
      items: ["Directive families", "Standards route", "Parallel obligations", "Clarification prompts"],
    },
  ];

  return (
    <div className={styles.emptyStateBody}>
      {hasError ? (
        <div className={styles.apiUnavailableCard}>
          <p className={styles.apiUnavailableTitle}>API may be starting up</p>
          <p className={styles.apiUnavailableText}>
            The analyzer backend sometimes takes a moment to wake up after inactivity. Paste a
            product description below and try again — it usually responds within 10–20 seconds.
          </p>
        </div>
      ) : null}
      <div className={styles.guidanceGrid}>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.key} className={styles.guidanceCard}>
              <div className={styles.guidanceCardTitle}>
                <Icon size={14} />
                <span className={styles.sectionLabel}>{section.label}</span>
              </div>
              <CompactList
                items={section.items}
                className={styles.guidanceList}
                itemClassName={styles.guidanceItem}
                markerClassName={styles.guidanceMarker}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
