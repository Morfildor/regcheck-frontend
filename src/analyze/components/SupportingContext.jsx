import { useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { titleCaseMinor } from "../helpers";
import { DirectivePill, CompactList, cx } from "./Pills";
import styles from "./SupportingContext.module.css";

export default function SupportingContext({ result, viewModel, description, copied, onCopy }) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className={styles.contextPanel}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className={styles.contextSummary}>
        <div>
          <span className={styles.contextEyebrow}>Analysis context</span>
          <h2 className={styles.contextTitle}>Supporting context</h2>
        </div>
        <div className={styles.contextSummaryRight}>
          {!open && viewModel.triggeredDirectives.length ? (
            <div className={styles.chipList}>
              {viewModel.triggeredDirectives.slice(0, 3).map((dk) => (
                <DirectivePill key={dk} directiveKey={dk} />
              ))}
              {viewModel.triggeredDirectives.length > 3 ? (
                <span className={styles.clarificationOverflow}>
                  +{viewModel.triggeredDirectives.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </summary>

      <div className={styles.contextBody}>
        <div className={styles.infoCard}>
          <span className={styles.sectionLabel}>Description used for current result</span>
          <p className={styles.contextText}>{description || "No description captured."}</p>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.sectionLabel}>Triggered directive families</span>
          <div className={styles.chipList}>
            {viewModel.triggeredDirectives.length ? (
              viewModel.triggeredDirectives.map((dk) => (
                <DirectivePill key={dk} directiveKey={dk} />
              ))
            ) : (
              <span className={styles.emptyCopy}>No directive families were returned.</span>
            )}
          </div>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.sectionLabel}>Copy / export</span>
          <button
            type="button"
            className={cx(styles.actionButton, styles.actionButtonSecondary, styles.fullWidthButton)}
            onClick={onCopy}
            aria-live="polite"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied to clipboard" : "Copy analysis summary"}
          </button>
        </div>

        {result?.future_watchlist?.length ? (
          <div className={styles.infoCard}>
            <span className={styles.sectionLabel}>Future watchlist</span>
            <CompactList
              items={result.future_watchlist.slice(0, 5)}
              renderItem={(item) => titleCaseMinor(item)}
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}
