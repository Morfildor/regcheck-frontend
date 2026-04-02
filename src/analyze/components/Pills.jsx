import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { DIRECTIVE_GLOSSARY, DIRECTIVE_PAGE_MAP } from "../workspaceGlossary";
import { directiveShort, directiveTone } from "../helpers";
import styles from "./Pills.module.css";

/** cx — className combiner; re-exported so other components can import it here. */
export function cx(...values) {
  return values.filter(Boolean).join(" ");
}

const PILL_TONE_CLASS = {
  positive: styles.pillPositive,
  warning:  styles.pillWarning,
  muted:    styles.pillMuted,
  strong:   styles.pillStrong,
};

export function TonePill({ children, tone = "muted", strong = false, tip }) {
  const el = (
    <span className={cx(styles.pill, PILL_TONE_CLASS[tone], strong ? styles.pillStrong : "")}>
      {children}
    </span>
  );
  return tip ? <GlossaryTip title={tip}>{el}</GlossaryTip> : el;
}

export function GlossaryTip({ directiveKey, title, children }) {
  const definition = title || DIRECTIVE_GLOSSARY[directiveKey];
  const [tipPos, setTipPos] = useState(null);
  const spanRef = useRef(null);
  const hideTimerRef = useRef(null);

  if (!definition) return <>{children}</>;

  return (
    <span
      ref={spanRef}
      className={styles.glossaryTip}
      onMouseEnter={() => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        const rect = spanRef.current?.getBoundingClientRect();
        if (rect) setTipPos({ x: rect.left + rect.width / 2, y: rect.top });
      }}
      onMouseLeave={() => {
        hideTimerRef.current = setTimeout(() => setTipPos(null), 180);
      }}
    >
      {children}
      {tipPos && createPortal(
        <span
          className={styles.glossaryTipFloat}
          style={{ left: tipPos.x, top: tipPos.y }}
        >
          {definition}
        </span>,
        document.body
      )}
    </span>
  );
}

export function DirectivePill({ directiveKey, linkToPage = false }) {
  const tone = directiveTone(directiveKey);
  const shortLabel = directiveShort(directiveKey);
  const pagePath = DIRECTIVE_PAGE_MAP[directiveKey];

  const inner = (
    <span
      className={styles.directivePill}
      style={{
        "--directive-bg":     tone.bg,
        "--directive-border": tone.bd,
        "--directive-text":   tone.text,
      }}
    >
      {shortLabel}
    </span>
  );

  const pill = <GlossaryTip directiveKey={directiveKey}>{inner}</GlossaryTip>;

  if (linkToPage && pagePath) {
    return (
      <a
        href={pagePath}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.directivePillLink}
        aria-label={`View ${shortLabel} directive details (opens in new tab)`}
        title="View directive summary"
      >
        {pill}
      </a>
    );
  }

  return pill;
}

export function CompactList({
  items,
  className,
  itemClassName,
  markerClassName,
  renderItem = (item) => item,
}) {
  if (!items?.length) return null;
  return (
    <ul className={className ?? styles.compactList}>
      {items.map((item, index) => (
        <li key={`${String(item)}-${index}`} className={itemClassName ?? styles.compactListItem}>
          <span className={markerClassName ?? styles.compactMarker} />
          <span>{renderItem(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export function DetailList({ items }) {
  return (
    <CompactList
      items={items}
      className={styles.detailList}
      itemClassName={styles.detailListItem}
      markerClassName={styles.detailBullet}
    />
  );
}
