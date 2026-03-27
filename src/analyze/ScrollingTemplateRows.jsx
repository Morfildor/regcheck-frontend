import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ScrollingTemplateRows.module.css";
import { DEFAULT_TEMPLATES } from "./helpers";

// ─── Row configuration ────────────────────────────────────────────
const ROW_CONFIGS = [
  { direction: -1, speed: 0.55 }, // top row:    right → left
  { direction: +1, speed: 0.48 }, // bottom row: left  → right
];

const GAP = 32;              // px gap between pills
const PILL_ESTIMATE_W = 155; // estimated pill width before DOM measurement
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

  const createPillRef = useRef(createPill);
  createPillRef.current = createPill;

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
        pills.push(createPillRef.current(rowIndex, x));
      }
      return pills;
    });

    forceUpdate((v) => v + 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track container width on resize ─────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
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
    const tick = () => {
      const w = containerWidthRef.current;
      if (!w) {
        rafRef.current = requestAnimationFrame(tick);
        return;
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
        for (const _ of exiting) { // eslint-disable-line no-unused-vars
          let spawnX;
          if (direction === -1) {
            // RTL: spawn beyond the rightmost surviving pill
            let maxRight = w;
            for (const p of survivors) {
              const el = pillElsRef.current.get(p.id);
              const pw = el ? el.offsetWidth : PILL_ESTIMATE_W;
              const right = p.x + pw;
              if (right > maxRight) maxRight = right;
            }
            spawnX = maxRight + GAP;
          } else {
            // LTR: spawn before the leftmost surviving pill
            let minLeft = survivors.length > 0 ? survivors[0].x : 0;
            for (const p of survivors) {
              if (p.x < minLeft) minLeft = p.x;
            }
            spawnX = minLeft - GAP - PILL_ESTIMATE_W;
          }
          survivors.push(createPillRef.current(rowIndex, spawnX));
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // intentionally empty — loop must never restart

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
