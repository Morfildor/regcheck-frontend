import { BookOpen, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useState } from "react";
import styles from "./OnboardingBanner.module.css";

const SAMPLE_DESCRIPTIONS = [
  {
    label: "Mains appliance",
    text: "Countertop coffee grinder with mains power (230 V AC), no wireless connectivity, food-contact grinding path, and removable bean hopper. Sold to consumers.",
  },
  {
    label: "Smart home sensor",
    text: "Battery-powered indoor air quality sensor with Bluetooth LE, companion mobile app, cloud account required, OTA updates, CO2 and humidity measurement. Consumer use.",
  },
  {
    label: "Industrial power supply",
    text: "DIN-rail 24 V DC power supply for industrial control cabinets. Mains input (230 V AC). No wireless. Rated for professional installation only.",
  },
];

/**
 * OnboardingBanner — shown on the Analyzer page when no analysis has run yet.
 * Explains what the tool does, what to include in the description, and offers
 * sample descriptions the user can load directly.
 *
 * Props:
 *   onLoadSample(text: string) — called when user selects a sample description
 */
export default function OnboardingBanner({ onLoadSample }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={styles.banner} aria-label="How to use the analyzer">
      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          <BookOpen size={18} />
        </div>
        <div className={styles.headerText}>
          <h2 className={styles.title}>How to get the best result</h2>
          <p className={styles.subtitle}>
            Describe your product and the analyzer will identify likely EU directives, standards,
            and any details that might change the scope.
          </p>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          aria-expanded={expanded}
          aria-controls="onboarding-details"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} aria-hidden="true" />
              <span className={styles.toggleLabel}>Less</span>
            </>
          ) : (
            <>
              <ChevronDown size={16} aria-hidden="true" />
              <span className={styles.toggleLabel}>More</span>
            </>
          )}
        </button>
      </div>

      <div
        id="onboarding-details"
        className={[styles.details, expanded ? styles.detailsOpen : ""].filter(Boolean).join(" ")}
        hidden={!expanded}
      >
        <div className={styles.grid}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Lightbulb size={14} aria-hidden="true" className={styles.sectionIcon} />
              Include these in your description
            </h3>
            <ul className={styles.list}>
              <li>Power source — mains (230 V AC), rechargeable battery, USB adapter</li>
              <li>Wireless — Wi-Fi, Bluetooth, NFC, cellular, or none</li>
              <li>Who uses it — consumers, professionals, children</li>
              <li>Where it is used — indoors, outdoors, worn on body</li>
              <li>Cloud or app dependency — cloud required, local only, OTA updates</li>
              <li>Any medical, food-contact, or safety-critical function</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>What you get back</h3>
            <ul className={styles.list}>
              <li><strong>Directive scope</strong> — which EU regulations are likely to apply</li>
              <li><strong>Standards route</strong> — the main harmonised standards to review</li>
              <li><strong>Parallel obligations</strong> — RoHS, REACH, WEEE, Battery Regulation</li>
              <li><strong>Missing details</strong> — gaps that could change the route</li>
              <li><strong>Risk level</strong> — a first-pass sense of scope complexity</li>
            </ul>
          </div>
        </div>

        {onLoadSample && (
          <div className={styles.samplesBlock}>
            <h3 className={styles.sectionTitle}>Load a sample description</h3>
            <p className={styles.samplesNote}>
              Select a sample to populate the description field. You can edit it before running.
            </p>
            <div className={styles.sampleRow}>
              {SAMPLE_DESCRIPTIONS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  className={styles.sampleChip}
                  onClick={() => onLoadSample(sample.text)}
                  aria-label={`Load sample: ${sample.label}`}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
