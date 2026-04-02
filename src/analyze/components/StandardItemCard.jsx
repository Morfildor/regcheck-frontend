import { TonePill, cx } from "./Pills";
import { inferStandardCategory, titleCaseMinor } from "../helpers";
import styles from "./StandardItemCard.module.css";

export default function StandardItemCard({ item }) {
  const hasVersionInfo = item.version || item.dated_version || item.harmonized_reference;
  const isHarmonized = Boolean(item.dated_version || item.harmonized_reference);
  const categoryTag = inferStandardCategory(item);

  return (
    <article className={cx(styles.standardCard, isHarmonized ? styles.standardCardHarmonized : "")}>
      <div className={styles.standardCardTop}>
        <span className={styles.standardCode}>{item.code || "Standard"}</span>
        {isHarmonized ? (
          <span className={styles.harmonizedBadge}>Harmonized</span>
        ) : categoryTag ? (
          <TonePill tone="muted">{categoryTag}</TonePill>
        ) : null}
        {isHarmonized && categoryTag ? <TonePill tone="muted">{categoryTag}</TonePill> : null}
      </div>
      <div className={styles.standardCardBody}>
        <h4 className={styles.standardTitle}>{titleCaseMinor(item.title || "Untitled standard")}</h4>
        {item.shortRationale ? <p className={styles.microRationale}>{item.shortRationale}</p> : null}
      </div>
      {hasVersionInfo ? (
        <div className={styles.standardVersionRow}>
          {item.dated_version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Harmonized ref</span>
              <span className={styles.versionValue}>{item.dated_version}</span>
            </div>
          ) : null}
          {item.version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Latest EU</span>
              <span className={styles.versionValue}>{item.version}</span>
            </div>
          ) : null}
          {item.harmonized_reference ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>OJ ref</span>
              <span className={styles.versionValue}>{item.harmonized_reference}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
