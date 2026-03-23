import styles from "./Surface.module.css";

export default function Surface({
  as: Tag = "section",
  eyebrow,
  title,
  text,
  actions = null,
  className = "",
  bodyClassName = "",
  children,
}) {
  return (
    <Tag className={[styles.surface, className].filter(Boolean).join(" ")}>
      {(eyebrow || title || text || actions) && (
        <header className={styles.header}>
          <div className={styles.copy}>
            {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {text ? <p className={styles.text}>{text}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      )}
      <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>{children}</div>
    </Tag>
  );
}
