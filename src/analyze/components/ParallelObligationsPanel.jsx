import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Surface from "../../shared/ui/Surface";
import { titleCaseMinor, slugify } from "../helpers";
import { getTimingLabel } from "../workspaceGlossary";
import { DirectivePill, cx } from "./Pills";
import styles from "./ParallelObligationsPanel.module.css";

function ParallelObligationCard({ item }) {
  const [open, setOpen] = useState(false);
  const cardId = `parallel-card-${slugify(item.directive_key || item.code || item.title || "item")}`;

  const previewText = item.shortRationale || item.summary || item.scope || item.rationale || "";
  const normalizedPreview = String(previewText || "").trim();

  const detailItems = [
    item.rationale && String(item.rationale).trim() !== normalizedPreview
      ? { key: "why-applies", label: "Why it applies", value: item.rationale }
      : null,
    (item.scope || item.summary) && String(item.scope || item.summary).trim() !== normalizedPreview
      ? { key: "scope", label: "Scope", value: item.scope || item.summary }
      : null,
    item.applicabilityBucket
      ? { key: "review-status", label: "Review status", value: item.applicabilityBucket }
      : null,
  ].filter(Boolean);

  const hasDetails = detailItems.length > 0;

  return (
    <article className={styles.obligationCard} id={cardId}>
      <button
        type="button"
        className={styles.obligationCardToggle}
        onClick={hasDetails ? () => setOpen((p) => !p) : undefined}
        aria-expanded={hasDetails ? open : undefined}
        aria-controls={hasDetails ? `${cardId}-body` : undefined}
        style={hasDetails ? undefined : { cursor: "default", pointerEvents: "none" }}
      >
        <div className={styles.obligationCardTop}>
          <div className={styles.obligationCardMeta}>
            <DirectivePill directiveKey={item.directive_key || "OTHER"} />
            {item.code ? <span className={styles.standardCode}>{item.code}</span> : null}
            {getTimingLabel(item.directive_key) ? (
              <span className={styles.timingBadge}>{getTimingLabel(item.directive_key)}</span>
            ) : null}
          </div>
          {hasDetails ? (
            <ChevronDown
              size={14}
              className={cx(styles.obligationCardChevron, open ? styles.obligationCardChevronOpen : "")}
            />
          ) : null}
        </div>
        <div className={styles.obligationCardBody}>
          <h4 className={styles.obligationTitle}>{titleCaseMinor(item.title || "Untitled obligation")}</h4>
          {normalizedPreview ? <p className={styles.obligationPreview}>{normalizedPreview}</p> : null}
        </div>
      </button>

      {open && hasDetails ? (
        <div id={`${cardId}-body`} className={styles.obligationDetail}>
          {detailItems.map((detail) => (
            <div key={detail.key} className={styles.obligationDetailItem}>
              <span className={styles.obligationDetailLabel}>{detail.label}</span>
              <p className={styles.obligationDetailValue}>{detail.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function flattenLegislationGroups(groups) {
  return (groups || []).flatMap((group) =>
    (group.items || []).map((item) => ({
      ...item,
      _groupKey: group.groupKey || group.key || "other",
    }))
  );
}

export default function ParallelObligationsPanel({ viewModel }) {
  const routeDirectiveKeys = new Set(viewModel.routeSections.map((s) => s.key));
  const filterNonRoute = (items) => items.filter((item) => !routeDirectiveKeys.has(item.directive_key));

  const conditionalItems = filterNonRoute(flattenLegislationGroups(viewModel.conditionalLegislationGroups));
  const peripheralItems = filterNonRoute(flattenLegislationGroups(viewModel.peripheralLegislationGroups));
  const groups = [
    {
      key: "conditional",
      title: "Check applicability",
      text: "These frameworks apply when the product includes specific features or market facts.",
      items: conditionalItems,
    },
    {
      key: "peripheral",
      title: "Reserve frameworks",
      text: "Keep in scope for expanded claims, environments, or technologies.",
      items: peripheralItems,
    },
  ];

  const totalItems = conditionalItems.length + peripheralItems.length;

  return (
    <Surface
      eyebrow="Adjacent frameworks"
      title="Parallel obligations"
      text={
        totalItems
          ? `${totalItems} framework${totalItems === 1 ? "" : "s"} outside the primary route — check applicability before sign-off.`
          : "No parallel obligations beyond the primary standards route."
      }
      bodyClassName={styles.sectionStack}
    >
      {groups.some((group) => group.items.length) ? (
        groups.map((group) =>
          group.items.length ? (
            <div key={group.key} className={styles.obligationGroup}>
              <div className={styles.obligationGroupHeader}>
                <span className={styles.obligationGroupTitle}>{group.title}</span>
                <span className={styles.obligationGroupCount}>{group.items.length}</span>
              </div>
              {group.key === "conditional" ? (
                <p className={styles.obligationGroupDesc}>{group.text}</p>
              ) : null}
              <div className={styles.sectionStack}>
                {group.items.map((item) => (
                  <ParallelObligationCard
                    key={`${group.key}-${item.directive_key || item.code || item.title}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          ) : null
        )
      ) : (
        <p className={styles.emptyCopy}>
          No parallel obligations were returned beyond the primary standards route.
        </p>
      )}
    </Surface>
  );
}
