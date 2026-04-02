import Surface from "../../shared/ui/Surface";
import styles from "./ComparisonPanel.module.css";

export default function ComparisonPanel({ changes }) {
  if (!changes?.length) return null;
  return (
    <Surface
      eyebrow="Session compare"
      title="Compared with previous analysis"
      text="Session-local changes only. No results are persisted."
      bodyClassName={styles.compareList}
    >
      {changes.map((change) => (
        <div key={change} className={styles.compareItem}>
          <span className={styles.compareMarker} />
          <span>{change}</span>
        </div>
      ))}
    </Surface>
  );
}
