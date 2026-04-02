import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ScrollingTemplateRows.module.css";
import { DEFAULT_TEMPLATES } from "./templateData";

// ─── Row configuration ────────────────────────────────────────────
const ROW_CONFIGS = [
  { direction: -1, speed: 0.15 }, // top row:    right → left
  { direction: +1, speed: 0.13 }, // bottom row: left  → right
];

const GAP = 16;              // px gap between pills
const PILL_ESTIMATE_W = 140; // estimated pill width before DOM measurement
const HISTORY_SIZE = 8;      // anti-repetition window per row

// ─── Helpers ─────────────────────────────────────────────────────
function pickTemplate(pool, history) {
  const avoid = new Set(history);
  const available = pool.filter((t) => !avoid.has(t.label));
  const src = available.length >= 3 ? available : pool;
  return src[Math.floor(Math.random() * src.length)];
}

// ─── Component ───────────────────────────────────────────────────
export default function ScrollingTemplateRows({ templates, onSelect }) {
  // Always have something to show even before metadata loads
  const pool = templates && templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  const containerRef = useRef(null);
  const containerWidthRef = useRef(0);
  const rafRef = useRef(null);
  const nextIdRef = useRef(0);

  // Mutable per-row pill arrays — mutated directly inside RAF loop
  // Shape: [rowIndex] = Array<{ id, label, text, x }>
  const rowsRef = useRef([[], []]);
  const historiesRef = useRef([[], []]); // anti-repetition per row

  // DOM element map: pill id → HTMLButtonElement
  const pillElsRef = useRef(new Map());

  // Guards the one-time post-paint redistribution
  const redistributedRef = useRef(false);

  // Exposes latest pool to the stable createPill callback
  const poolRef = useRef(pool);
  poolRef.current = pool;

  // Trigger React reconciliation only when pill list structure changes
  const [, forceUpdate] = useState(0);

  // ── createPill ───────────────────────────────────────────────
  // Stable callback — reads poolRef and historiesRef via ref indirection
  const createPill = useCallback((rowIndex, x) => {
    const hist = historiesRef.current[rowIndex];
    const template = pickTemplate(poolRef.current, hist);
    const id = nextIdRef.current++;
    historiesRef.current[rowIndex] = [
      ...hist.slice(-(HISTORY_SIZE - 1)),
      template.label,
    ];
    return { id, label: template.label, text: template.text, x };
  }, []); // intentionally stable — deps accessed via refs

  // ── Initialise rows (once on mount) ─────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.offsetWidth || 800;
    containerWidthRef.current = w;

    const spacing = PILL_ESTIMATE_W + GAP;
    const count = Math.ceil(w / spacing) + 3; // +3: off-screen buffer each side

    rowsRef.current = ROW_CONFIGS.map((cfg, rowIndex) => {
      const pills = [];
      for (let i = 0; i < count; i++) {
        // RTL: spread pills left→right (smallest x first)
        // LTR: spread pills right→left so they stream rightward from the start
        const x =
          cfg.direction === -1
            ? i * spacing
            : w - (i + 1) * spacing;
        pills.push(createPill(rowIndex, x));
      }
      return pills;
    });

    forceUpdate((v) => v + 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track container width on resize ─────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidthRef.current = entry.contentRect.width;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── RAF animation loop (starts once, never restarts) ─────────
  useEffect(() => {
    // Pause animation while the tab is not visible to avoid wasted CPU.
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const tick = () => {
      const w = containerWidthRef.current;
      if (!w) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // ── One-time post-paint redistribution using actual widths ──
      // Runs on the first frame where every pill has a measured DOM element.
      // Corrects the initial estimate-based positions so pills never overlap.
      if (!redistributedRef.current) {
        const allMeasured = rowsRef.current.every(
          (pills) =>
            pills.length > 0 && pills.every((p) => pillElsRef.current.has(p.id))
        );
        if (allMeasured) {
          redistributedRef.current = true;
          rowsRef.current.forEach((pills) => {
            const sorted = [...pills].sort((a, b) => a.x - b.x);
            let cursor = sorted[0].x;
            for (const p of sorted) {
              p.x = cursor;
              const el = pillElsRef.current.get(p.id);
              if (el) {
                el.style.transform = `translateX(${p.x}px)`;
                cursor += el.offsetWidth + GAP;
              } else {
                cursor += PILL_ESTIMATE_W + GAP;
              }
            }
          });
        }
      }

      let structureChanged = false;

      ROW_CONFIGS.forEach(({ direction, speed }, rowIndex) => {
        const pills = rowsRef.current[rowIndex];
        if (!pills.length) return;

        // Move every pill and push the new x directly to its DOM transform
        for (const pill of pills) {
          pill.x += direction * speed;
          const el = pillElsRef.current.get(pill.id);
          if (el) el.style.transform = `translateX(${pill.x}px)`;
        }

        // Collect pills that have fully exited the container
        const exiting = [];
        for (const pill of pills) {
          const el = pillElsRef.current.get(pill.id);
          const pw = el ? el.offsetWidth : PILL_ESTIMATE_W;
          const exited =
            direction === -1
              ? pill.x + pw < -10   // RTL: gone past left edge
              : pill.x > w + 10;    // LTR: gone past right edge
          if (exited) exiting.push(pill);
        }

        if (exiting.length === 0) return;

        structureChanged = true;
        const exitIds = new Set(exiting.map((p) => p.id));
        const survivors = pills.filter((p) => !exitIds.has(p.id));

        // Spawn one replacement per exited pill from the opposite edge.
        // Recompute the leading edge on each iteration so batched spawns
        // stack correctly rather than overlapping.
        for (let i = 0; i < exiting.length; i++) {
          let spawnX;
          if (direction === -1) {
            // RTL: spawn beyond the rightmost surviving pill (uses actual widths)
            let maxRight = w;
            for (const p of survivors) {
              const el = pillElsRef.current.get(p.id);
              const pw = el ? el.offsetWidth : PILL_ESTIMATE_W;
              const right = p.x + pw;
              if (right > maxRight) maxRight = right;
            }
            spawnX = maxRight + GAP;
          } else {
            // LTR: spawn before the leftmost surviving pill.
            // Use the leftmost pill's actual width as a proxy for the incoming
            // pill to get a tighter estimate than the static PILL_ESTIMATE_W.
            let minLeft = 0;
            let minPill = null;
            for (const p of survivors) {
              if (minPill === null || p.x < minLeft) { minLeft = p.x; minPill = p; }
            }
            const proxyEl = minPill ? pillElsRef.current.get(minPill.id) : null;
            const proxyW = proxyEl ? proxyEl.offsetWidth : PILL_ESTIMATE_W;
            spawnX = minLeft - GAP - proxyW;
          }
          survivors.push(createPill(rowIndex, spawnX));
        }

        // Purge stale DOM refs for pills that just exited
        for (const p of exiting) pillElsRef.current.delete(p.id);

        rowsRef.current[rowIndex] = survivors;
      });

      if (structureChanged) {
        forceUpdate((v) => v + 1);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [createPill]); // createPill is stable (useCallback with [] deps) — loop never restarts

  // ── Render ──────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={styles.scrollingRows}>
      {rowsRef.current.map((pills, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {pills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              ref={(el) => {
                if (el) pillElsRef.current.set(pill.id, el);
                else pillElsRef.current.delete(pill.id);
              }}
              className={styles.pill}
              style={{ transform: `translateX(${pill.x}px)` }}
              onClick={() => onSelect(pill.text)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
