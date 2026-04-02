import { Check, AlertCircle, Ban, ArrowRight } from "lucide-react";
import Surface from "../../shared/ui/Surface";
import { DirectivePill, cx } from "./Pills";
import styles from "./EvidencePanel.module.css";

const EVIDENCE_SECTIONS = [
  { key: "evidence",    icon: Check,        iconClass: styles.iconCheck,   label: "Typical evidence", field: "typicalEvidence", blockersClass: "" },
  { key: "missing",     icon: AlertCircle,  iconClass: styles.iconMissing, label: "Common gaps",      field: "commonMissing",   blockersClass: "" },
  { key: "blockers",    icon: Ban,          iconClass: styles.iconBlocker, label: "Blockers",         field: "blockers",        blockersClass: styles.evidenceSectionBlockers },
  { key: "nextActions", icon: ArrowRight,   iconClass: styles.iconNext,    label: "Next actions",     field: "nextActions",     blockersClass: "" },
];

function DetailList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className={styles.detailList}>
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
      text="Pre-lab checklist for the active compliance routes."
      bodyClassName={styles.evidenceGrid}
    >
      {viewModel.evidenceNeeds.length ? (
        viewModel.evidenceNeeds.map((need) => (
          <div key={need.key} className={styles.evidenceCard}>
            <div className={styles.evidenceHeader}>
              <h3 className={styles.groupTitle}>{need.label}</h3>
              <DirectivePill directiveKey={need.key} />
            </div>
            {EVIDENCE_SECTIONS.map(({ key, icon: Icon, iconClass, label, field, blockersClass }) =>
              need[field]?.length ? (
                <div key={key} className={cx(styles.evidenceSection, blockersClass)}>
                  <div className={styles.evidenceSectionHeader}>
                    <Icon size={11} className={iconClass} />
                    <span className={cx(styles.metaLabel, blockersClass ? styles.metaLabelBlockers : "")}>
                      {label}
                    </span>
                  </div>
                  <DetailList items={need[field]} />
                </div>
              ) : null
            )}
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
