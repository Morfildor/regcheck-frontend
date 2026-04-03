import { useState, useEffect } from "react";

/**
 * Tracks which results section is currently in view based on scroll position.
 * Returns the id of the active (most-recently-scrolled-past) section.
 */
export function useResultsActiveSection(sectionIds) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!sectionIds.length) return;
    const handleScroll = () => {
      const header = document.querySelector("header");
      const offset = (header ? header.getBoundingClientRect().height : 60) + 24;
      let found = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) found = id;
      }
      setActiveId(found || sectionIds[0] || null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds]);

  return activeId;
}

/**
 * Smoothly scrolls to a results section by id, accounting for sticky header height.
 */
export function scrollToResultsSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector("header");
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
