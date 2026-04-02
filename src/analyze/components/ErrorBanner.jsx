import { AlertTriangle, RefreshCcw } from "lucide-react";
import styles from "./ErrorBanner.module.css";

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  const isNetwork = /network|fetch|failed to fetch|load failed|unavailable|timeout|abort/i.test(message);
  return (
    <div className={styles.errorBanner} role="alert">
      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
      <div className={styles.errorBody}>
        <div className={styles.errorTitle}>{isNetwork ? "API unreachable" : "Analysis error"}</div>
        <div className={styles.errorText}>
          {isNetwork
            ? "The analyzer could not reach the API. The service may be starting up — try again in a moment."
            : message}
        </div>
      </div>
      {onRetry ? (
        <button type="button" className={styles.errorRetry} onClick={onRetry}>
          <RefreshCcw size={13} />
          Try again
        </button>
      ) : null}
    </div>
  );
}
