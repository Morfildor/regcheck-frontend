import { Moon, Sun } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { PRIMARY_NAV_ITEMS } from "./navigation";
import { useTheme } from "./ThemeContext";
import styles from "./AppShell.module.css";

function navClassName(isActive) {
  return [styles.navLink, isActive ? styles.navLinkActive : ""].filter(Boolean).join(" ");
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={!isDark}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
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

          <nav className={styles.primaryNav} aria-label="Primary navigation">
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

        <div className={styles.actions}>
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ actions = null, mainClassName = "", children }) {
  return (
    <div className={styles.shell}>
      <SiteHeader actions={actions} />
      <main
        id="main-content"
        className={[styles.main, mainClassName].filter(Boolean).join(" ")}
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
