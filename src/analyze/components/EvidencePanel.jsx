import { Check, AlertCircle, Ban, ArrowRight } from "lucide-react";
import Surface from "../../shared/ui/Surface";
import { DirectivePill, cx } from "./Pills";
import styles from "./EvidencePanel.module.css";

const EVIDENCE_SECTIONS = [
  { key: "evidence",    icon: Check,        iconClass: styles.iconCheck,   label: "Typical evidence", field: "typicalEvidence", variant: "" },
  { key: "missing",     icon: AlertCircle,  iconClass: styles.iconMissing, label: "Common gaps",      field: "commonMissing",   variant: styles.evidenceSectionGap },
  { key: "blockers",    icon: Ban,          iconClass: styles.iconBlocker, label: "Blockers",         field: "blockers",        variant: styles.evidenceSectionBlockers },
  { key: "nextActions", icon: ArrowRight,   iconClass: styles.iconNext,    label: "Next actions",     field: "nextActions",     variant: styles.evidenceSectionNext },
];

function DetailList({ items, compact }) {
  if (!items?.length) return null;
  return (
    <ul className={cx(styles.detailList, compact ? styles.detailListCompact : "")}>
      {items.map((item, i) => (
        <li key={`${String(item)}-${i}`} className={styles.detailListItem}>
          <span className={styles.detailBullet} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function EvidencePanel({ viewModel }) {
  return (
    <Surface
      eyebrow="Evidence gaps"
      title="Evidence and common gaps"
      text="Pre-lab checklist for the active compliance routes. Focus on blockers first, then gaps."
      bodyClassName={styles.evidenceGrid}
    >
      {viewModel.evidenceNeeds.length ? (
        viewModel.evidenceNeeds.map((need) => (
          <div key={need.key} className={styles.evidenceCard}>
            <div className={styles.evidenceHeader}>
              <h3 className={styles.groupTitle}>{need.label}</h3>
              <DirectivePill directiveKey={need.key} />
            </div>
            <div className={styles.evidenceSections}>
              {EVIDENCE_SECTIONS.map(({ key, icon: Icon, iconClass, label, field, variant }) =>
                need[field]?.length ? (
                  <div key={key} className={cx(styles.evidenceSection, variant)}>
                    <div className={styles.evidenceSectionHeader}>
                      <Icon size={11} className={iconClass} />
                      <span className={cx(styles.metaLabel, variant ? styles[`metaLabel--${key}`] : "")}>
                        {label}
                      </span>
                    </div>
                    <DetailList items={need[field]} compact={key === "nextActions"} />
                  </div>
                ) : null
              )}
            </div>
          </div>
        ))
      ) : (
        <p className={styles.emptyCopy}>
          No evidence prompts were returned. The trust layer still shows whether the scope is assumption-heavy.
        </p>
      )}
    </Surface>
  );
}
