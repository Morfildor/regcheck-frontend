import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildDynamicTemplates } from "../analyze/helpers";
import MarketingLayout from "./MarketingLayout";
import styles from "./HomePage.module.css";

const OUTPUT_ITEMS = [
  {
    label: "Directive families",
    text: "See the likely EU frameworks triggered by the description.",
  },
  {
    label: "Standards route",
    text: "Get a first view of the standards path to review next.",
  },
  {
    label: "Parallel obligations",
    text: "Catch related obligations that may sit outside the core route.",
  },
  {
    label: "Missing details",
    text: "Find the facts most likely to change the result before review.",
  },
];

const INPUT_HINTS = [
  "Main function and intended use",
  "Power source and included power hardware",
  "Wi-Fi, Bluetooth, NFC, or no wireless",
  "Battery, app, cloud, or OTA update details",
];

const GOOD_FOR_ITEMS = [
  "Early product intake when the description is still rough",
  "Internal routing between compliance, engineering, and sourcing",
  "Spotting scope changes caused by radios, software, or power details",
  "Preparing a stronger brief before lab or consultant review",
];

const REVIEW_ITEMS = [
  "Formal conformity assessment and accredited testing",
  "Final legal or certification decisions",
  "Sector-specific edge cases that need specialist judgment",
  "Market-entry sign-off when evidence is still incomplete",
];

const EXTRA_STARTER_EXAMPLES = [
  {
    label: "Connected appliance",
    text: "Connected espresso machine with mains power, Wi-Fi app control, OTA updates, grinder, and food-contact brew path.",
  },
  {
    label: "Consumer device",
    text: "Battery-powered smart thermostat with Bluetooth setup, Wi-Fi connectivity, cloud account, and wall-mount installation.",
  },
  {
    label: "Industrial tool",
    text: "DIN-rail power supply for industrial cabinets with 24 V DC output, mains input, and no wireless connectivity.",
  },
  {
    label: "Security camera",
    text: "Outdoor security camera with mains power, Wi-Fi radio, cloud account, OTA updates, microphone, speaker, motion detection, and app control.",
  },
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth, cloud account, OTA updates, LiDAR navigation, and camera.",
  },
  {
    label: "Baby monitor",
    text: "Connected baby monitor with camera, microphone, speaker, Wi-Fi radio, app control, cloud account, and remote viewing.",
  },
];

function buildAnalyzePath(description) {
  const trimmed = String(description || "").trim();
  if (!trimmed) return "/analyze";

  const params = new URLSearchParams();
  params.set("q", trimmed);
  return `/analyze?${params.toString()}`;
}

function shuffle(items, seed) {
  const pool = [...items];
  let value = seed || 0.5;

  for (let index = pool.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const swapIndex = Math.floor((value / 233280) * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [starterSeed] = useState(() => Math.random());

  const starterExamples = useMemo(() => {
    const merged = [...buildDynamicTemplates([]), ...EXTRA_STARTER_EXAMPLES];
    const deduped = merged.filter(
      (item, index, array) =>
        array.findIndex((candidate) => candidate.label.toLowerCase() === item.label.toLowerCase()) === index
    );
    return shuffle(deduped, starterSeed).slice(0, 12);
  }, [starterSeed]);

  function handleSubmit(event) {
    event.preventDefault();
    navigate(buildAnalyzePath(draft));
  }

  return (
    <MarketingLayout
      meta={{
        title: "RuleGrid",
        description:
          "Describe a product and get a first-pass EU regulatory route before formal review begins.",
        canonicalPath: "/",
      }}
      actions={
        <Link to="/analyze" className={styles.headerAction}>
          Open analyzer
        </Link>
      }
    >
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>EU product scoping</span>
          <h1 className={styles.heroTitle}>Start with what you know about the product.</h1>
          <p className={styles.heroText}>
            Paste a rough description. RuleGrid carries it into the analyzer so the team can review
            likely directives, standards, and missing details from a real starting point.
          </p>

          <div className={styles.heroSignals}>
            <span className={styles.signal}>Built for early routing</span>
            <span className={styles.signal}>Works with incomplete detail</span>
            <span className={styles.signal}>Not a certification decision</span>
          </div>
        </div>

        <form className={styles.intakePanel} onSubmit={handleSubmit}>
          <div className={styles.panelHeader}>
            <span className={styles.panelEyebrow}>Quick start</span>
            <h2 className={styles.panelTitle}>Describe the product</h2>
            <p className={styles.panelText}>You can refine the draft after you land on `/analyze`.</p>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Product description</span>
            <textarea
              className={styles.textarea}
              rows={7}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Product description quick start"
              placeholder="Example: Connected espresso machine with mains power, Wi-Fi app control, OTA updates, grinder, and food-contact brew path."
            />
          </label>

          <div className={styles.exampleBlock}>
            <span className={styles.fieldLabel}>Example prompts</span>
            <div className={styles.exampleRow}>
              {starterExamples.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  className={styles.exampleChip}
                  onClick={() => setDraft(example.text)}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panelActions}>
            <button type="submit" className={styles.primaryButton}>
              Analyze product
            </button>
            <Link to="/analyze" className={styles.secondaryButton}>
              Open empty analyzer
            </Link>
          </div>

          <p className={styles.panelNote}>
            The text above is passed into the analyzer as your starting draft.
          </p>
        </form>
      </section>

      <section className={styles.outputStrip} aria-label="Analyzer output">
        {OUTPUT_ITEMS.map((item) => (
          <div key={item.label} className={styles.outputItem}>
            <span className={styles.outputLabel}>{item.label}</span>
            <p className={styles.outputText}>{item.text}</p>
          </div>
        ))}
      </section>

      <section className={styles.lowerGrid}>
        <section className={styles.sectionBlock}>
          <span className={styles.sectionEyebrow}>What to include</span>
          <h2 className={styles.sectionTitle}>A better first pass comes from a few concrete facts.</h2>
          <ul className={styles.list}>
            {INPUT_HINTS.map((item) => (
              <li key={item} className={styles.listItem}>
                <span className={styles.listMarker} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.sectionBlock}>
          <span className={styles.sectionEyebrow}>Where it fits</span>
          <h2 className={styles.sectionTitle}>Useful for first-pass routing, not final sign-off.</h2>

          <div className={styles.listGrid}>
            <div className={styles.listGroup}>
              <h3 className={styles.groupTitle}>Good for</h3>
              <ul className={styles.list}>
                {GOOD_FOR_ITEMS.map((item) => (
                  <li key={item} className={styles.listItem}>
                    <span className={styles.listMarker} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.listGroup}>
              <h3 className={styles.groupTitle}>Still needs expert review</h3>
              <ul className={styles.list}>
                {REVIEW_ITEMS.map((item) => (
                  <li key={item} className={styles.listItem}>
                    <span className={`${styles.listMarker} ${styles.listMarkerMuted}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </section>

      <div className={styles.footerLinks}>
        <Link to="/about" className={styles.footerLink}>
          About RuleGrid
          <ArrowRight size={14} />
        </Link>
        <Link to="/contact" className={styles.footerLink}>
          Contact
          <ArrowRight size={14} />
        </Link>
      </div>
    </MarketingLayout>
  );
}
