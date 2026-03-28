import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./DisclaimerBanner.module.css";

/**
 * DisclaimerBanner — communicates the scope and limitations of RuleGrid.
 *
 * RuleGrid provides a preliminary regulatory scoping aid and is NOT a
 * substitute for formal conformity assessment by qualified experts.
 *
 * Props:
 *   compact (boolean) — renders a one-line version suitable for result page footers
 */
export default function DisclaimerBanner({ compact = false }) {
  if (compact) {
    return (
      <p className={styles.compact} role="note">
        <AlertTriangle size={13} aria-hidden="true" className={styles.compactIcon} />
        RuleGrid is a preliminary scoping aid — not a substitute for formal conformity assessment.{" "}
        <Link to="/contact" className={styles.link}>
          Contact compliance experts
        </Link>{" "}
        for certification decisions.
      </p>
    );
  }

  return (
    <aside className={styles.banner} role="note" aria-label="Disclaimer">
      <div className={styles.iconWrap} aria-hidden="true">
        <AlertTriangle size={18} />
      </div>
      <div className={styles.body}>
        <p className={styles.heading}>Preliminary scoping — not a certification decision</p>
        <p className={styles.text}>
          RuleGrid analyses the product description you provide and returns a first-pass view of the
          likely EU regulatory scope. The result depends entirely on the accuracy and completeness
          of the description. It does not replace a formal conformity assessment, accredited
          laboratory testing, or advice from a qualified compliance specialist.
        </p>
        <p className={styles.text}>
          Before placing a product on the EU market, verify the scope with an accredited body and
          obtain a formal EU Declaration of Conformity based on a full technical file.{" "}
          <Link to="/contact" className={styles.link}>
            Contact the RuleGrid team
          </Link>{" "}
          to discuss expert review options.
        </p>
      </div>
    </aside>
  );
}
