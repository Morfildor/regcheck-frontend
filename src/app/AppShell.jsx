import { Link, NavLink } from "react-router-dom";
import { PRIMARY_NAV_ITEMS } from "./navigation";
import styles from "./AppShell.module.css";

function navClassName(isActive) {
  return [styles.navLink, isActive ? styles.navLinkActive : ""].filter(Boolean).join(" ");
}

export function SiteHeader({ actions = null }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.leading}>
          <Link to="/" className={styles.brand} aria-label="RuleGrid home">
            <div className={styles.brandMark}>
              <img
                src={`${process.env.PUBLIC_URL}/logo512.png`}
                alt="RuleGrid"
                className={styles.brandLogo}
              />
            </div>
            <div className={styles.brandCopy}>
              <div className={styles.brandTitle}>RuleGrid</div>
              <div className={styles.brandSubtitle}>EU regulatory scoping</div>
            </div>
          </Link>

          <nav className={styles.primaryNav} aria-label="Primary">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => navClassName(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.actions}>{actions}</div>
      </div>
    </header>
  );
}

export default function AppShell({ actions = null, mainClassName = "", children }) {
  return (
    <div className={styles.shell}>
      <SiteHeader actions={actions} />
      <main className={[styles.main, mainClassName].filter(Boolean).join(" ")}>{children}</main>
    </div>
  );
}
