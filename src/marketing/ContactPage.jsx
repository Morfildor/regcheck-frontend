import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Surface from "../shared/ui/Surface";
import MarketingLayout from "./MarketingLayout";
import styles from "./MarketingPage.module.css";

const CONTACT_TOPICS = [
  "Consultation request",
  "Demo request",
  "Workflow discussion",
  "Tool feedback",
  "Partnership inquiry",
];

const WHAT_TO_INCLUDE = [
  "Product category, intended market, and launch timing",
  "Power architecture, radios, cloud, and software dependencies",
  "The current uncertainty or decision bottleneck",
  "What kind of handoff or review support the team needs next",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    topic: CONTACT_TOPICS[0],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const subject = encodeURIComponent(`[RuleGrid] ${form.topic}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:hello@rulegrid.net?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <MarketingLayout
      meta={{
        title: "Contact RuleGrid",
        description:
          "Start a workflow, consulting, or product discussion with the RuleGrid team.",
        canonicalPath: "/contact",
      }}
      actions={
        <Link to="/analyze" className={styles.buttonSecondary}>
          Open analyzer
        </Link>
      }
    >
      <Surface bodyClassName={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>Start a discussion</span>
          <h1 className={styles.heroTitle}>Bring the current blocker. We’ll start from the route.</h1>
          <p className={styles.heroText}>
            Use the form below to draft an inquiry around your current product or workflow.
            RuleGrid is best discussed with enough product context to understand whether the route
            issue is about scope, missing inputs, or expert escalation.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.miniStat}>
            <span className={styles.miniStatValue}>Direct email</span>
            <p className={styles.miniStatLabel}>
              Reach the team at <a href="mailto:hello@rulegrid.net">hello@rulegrid.net</a>.
            </p>
          </div>
        </div>
      </Surface>

      <div className={styles.contactGrid}>
        <Surface eyebrow="Inquiry form" title="Prepare your message">
          <form onSubmit={handleSubmit} className={styles.stack}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Name</span>
                <input
                  className={styles.fieldInput}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={styles.fieldInput}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Company</span>
                <input
                  className={styles.fieldInput}
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Company or team"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Topic</span>
                <select
                  className={styles.fieldSelect}
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                >
                  {CONTACT_TOPICS.map((topic) => (
                    <option key={topic}>{topic}</option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.fieldLabel}>Message</span>
                <textarea
                  className={styles.fieldTextarea}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe the product, current uncertainty, and what kind of help you need."
                  required
                />
              </label>
            </div>

            <div className={styles.buttonRow}>
              <button type="submit" className={styles.buttonPrimary}>
                <Send size={15} />
                Open email draft
              </button>
              <a href="mailto:hello@rulegrid.net" className={styles.buttonGhost}>
                <Mail size={15} />
                Direct email
              </a>
            </div>

            {submitted ? (
              <div className={styles.successBox}>
                Your email client should open with a drafted inquiry. Edit and send when ready.
              </div>
            ) : null}
          </form>
        </Surface>

        <div className={styles.stack}>
          <Surface eyebrow="What to include" title="For a stronger first reply">
            <ul className={styles.accentList}>
              {WHAT_TO_INCLUDE.map((item) => (
                <li key={item} className={styles.accentListItem}>
                  <span className={styles.accentDot} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface eyebrow="Fastest route" title="Try the analyzer first">
            <p className={styles.contactNote}>
              If your main blocker is route clarity rather than consulting availability, start in
              the analyzer and bring the resulting route into the discussion.
            </p>
            <div className={styles.buttonRow}>
              <Link to="/analyze" className={styles.buttonSecondary}>
                Open analyzer
              </Link>
            </div>
          </Surface>
        </div>
      </div>
    </MarketingLayout>
  );
}
