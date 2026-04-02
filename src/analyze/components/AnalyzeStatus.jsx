import { useState, useEffect } from "react";
import { Check, LoaderCircle } from "lucide-react";
import styles from "./AnalyzeStatus.module.css";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

const ANALYSIS_STEPS = [
  "Reading product description",
  "Identifying directive families",
  "Mapping standards route",
  "Checking parallel obligations",
  "Finalizing compliance scope",
];

export default function AnalyzeStatus({ busy }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!busy) {
      setActiveStep(0);
      return;
    }
    setActiveStep(0);
    const delays = [700, 1500, 2400, 3400];
    const timers = delays.map((delay, i) =>
      setTimeout(() => setActiveStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [busy]);

  if (!busy) return null;

  const progress = Math.round((activeStep / (ANALYSIS_STEPS.length - 1)) * 85);

  return (
    <div className={styles.analyzeCard} role="status" aria-live="polite">
      <div className={styles.analyzeCardHeader}>
        <LoaderCircle size={14} className={styles.spin} />
        <span className={styles.analyzeCardTitle}>Analyzing product</span>
        <span className={styles.analyzeCardProgress}>{progress}%</span>
      </div>
      <div className={styles.analyzeSteps}>
        {ANALYSIS_STEPS.map((step, i) => (
          <div
            key={step}
            className={cx(
              styles.analyzeStep,
              i < activeStep ? styles.analyzeStepDone : "",
              i === activeStep ? styles.analyzeStepActive : "",
              i > activeStep ? styles.analyzeStepPending : ""
            )}
          >
            <span className={styles.analyzeStepDot}>
              {i < activeStep
                ? <Check size={9} />
                : i === activeStep
                ? <LoaderCircle size={9} className={styles.spin} />
                : null}
            </span>
            <span className={styles.analyzeStepLabel}>{step}</span>
          </div>
        ))}
      </div>
      <div className={styles.analyzeProgressTrack}>
        <div className={styles.analyzeProgressFill} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
