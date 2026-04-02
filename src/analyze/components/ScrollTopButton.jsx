import { ArrowUp } from "lucide-react";
import styles from "./ScrollTopButton.module.css";

export default function ScrollTopButton({ visible }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      className={styles.scrollTop}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <ArrowUp size={15} />
    </button>
  );
}
