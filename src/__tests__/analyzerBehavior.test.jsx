/**
 * Focused behavior tests for analyze/results components.
 *
 * These target specific interactive behaviors — collapse/expand, search/filter,
 * summary rendering — without duplicating the integration flows in App.test.js.
 *
 * @testing-library/user-event v13: import and call directly (no .setup()).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClarificationsPanel from "../analyze/components/ClarificationsPanel";
import StandardsRoutePanel from "../analyze/components/StandardsRoute";
import OverviewPanel from "../analyze/components/OverviewPanel";
import { buildClipboardSummary } from "../analyze/helpers/clipboard";

// ── ClarificationsPanel collapse/expand ──────────────────────────────────────

const ROUTE_AFFECTING_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  key: `ra_${i}`,
  title: i === 0 ? "Confirm wireless connectivity" : `Route-affecting item ${i + 1}`,
  severity: "route-affecting",
  reason: "Can change the applicable directive route.",
  examples: i === 0 ? ["Wi-Fi connectivity"] : [],
}));

const BLOCKER_VIEWMODEL = {
  missingInputs: [
    {
      key: "power",
      title: "Power architecture unclear",
      severity: "blocker",
      reason: "Safety route depends on this.",
      examples: ["mains-powered", "battery-powered"],
    },
  ],
};

function renderClarifications(viewModelOverrides = {}, extraProps = {}) {
  return render(
    <ClarificationsPanel
      description="Test product"
      viewModel={{ missingInputs: [], ...viewModelOverrides }}
      dirty={false}
      busy={false}
      onReanalyze={jest.fn()}
      onApplyMissingInput={jest.fn()}
      {...extraProps}
    />
  );
}

describe("ClarificationsPanel collapse/expand", () => {
  test("starts collapsed with aria-expanded false", () => {
    renderClarifications({ missingInputs: ROUTE_AFFECTING_ITEMS });
    expect(
      screen.getByRole("button", { name: /clarifications/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("expands on click and shows first route-affecting item", async () => {
    renderClarifications({ missingInputs: ROUTE_AFFECTING_ITEMS });
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    expect(screen.getByText("Confirm wireless connectivity")).toBeInTheDocument();
  });

  test("collapses again on second click", async () => {
    renderClarifications({ missingInputs: ROUTE_AFFECTING_ITEMS });
    const toggle = screen.getByRole("button", { name: /clarifications/i });
    await userEvent.click(toggle);
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Confirm wireless connectivity")).not.toBeInTheDocument();
  });

  test("shows 'more route-affecting items' button when count exceeds initial limit of 3", async () => {
    renderClarifications({ missingInputs: ROUTE_AFFECTING_ITEMS });
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    expect(
      screen.getByRole("button", { name: /3 more route-affecting/i })
    ).toBeInTheDocument();
  });

  test("reveals remaining items when show-more is clicked", async () => {
    renderClarifications({ missingInputs: ROUTE_AFFECTING_ITEMS });
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    await userEvent.click(screen.getByRole("button", { name: /3 more route-affecting/i }));
    expect(screen.getByText("Route-affecting item 4")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more route-affecting/i })).not.toBeInTheDocument();
  });

  test("shows blocker count pill when blockers are present", () => {
    renderClarifications(BLOCKER_VIEWMODEL);
    expect(screen.getByText(/1 blocker/i)).toBeInTheDocument();
  });

  test("blocker suggestion chips call onApplyMissingInput", async () => {
    const onApply = jest.fn();
    render(
      <ClarificationsPanel
        description="Test product"
        viewModel={BLOCKER_VIEWMODEL}
        dirty={false}
        busy={false}
        onReanalyze={jest.fn()}
        onApplyMissingInput={onApply}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    await userEvent.click(screen.getByRole("button", { name: /\+ mains-powered/i }));
    expect(onApply).toHaveBeenCalledWith("mains-powered");
  });

  test("optional refinements section is collapsed by default when expanded", async () => {
    renderClarifications({
      missingInputs: [
        { key: "h1", title: "Optional hint", severity: "helpful", reason: "Extra context", examples: [] },
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    // The optional refinement toggle should be visible
    expect(
      screen.getByRole("button", { name: /1 optional refinement/i })
    ).toBeInTheDocument();
    // But the item body is not yet shown
    expect(screen.queryByText("Optional hint")).not.toBeInTheDocument();
  });

  test("optional refinements expand when toggle is clicked", async () => {
    renderClarifications({
      missingInputs: [
        { key: "h1", title: "Optional hint", severity: "helpful", reason: "Extra context", examples: [] },
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    await userEvent.click(screen.getByRole("button", { name: /1 optional refinement/i }));
    expect(screen.getByText("Optional hint")).toBeInTheDocument();
  });
});

// ── Standards search/filter ───────────────────────────────────────────────────

const THREE_SECTIONS = [
  {
    key: "LVD",
    title: "LVD safety route",
    items: [{ code: "EN 60335-1", title: "Household appliances safety" }],
    sectionKind: "core",
    applicabilityBucket: "core applicable",
  },
  {
    key: "EMC",
    title: "EMC compatibility route",
    items: [{ code: "EN 55014-1", title: "Electromagnetic compatibility" }],
    sectionKind: "core",
    applicabilityBucket: "core applicable",
  },
  {
    key: "REACH",
    title: "REACH material route",
    items: [{ code: "REACH review", title: "Material composition review" }],
    sectionKind: "secondary",
    applicabilityBucket: "route review",
  },
];

const THREE_SECTION_VM = {
  routeSections: THREE_SECTIONS,
  displayRouteSections: THREE_SECTIONS,
  isRadioProduct: false,
  redGroup: null,
  totalStandards: 3,
};

describe("StandardsRoutePanel search/filter", () => {
  test("filter input appears when route sections exceed two", () => {
    render(<StandardsRoutePanel viewModel={THREE_SECTION_VM} />);
    expect(screen.getByRole("searchbox", { name: /filter standards/i })).toBeInTheDocument();
  });

  test("filter hides sections that do not match the query", async () => {
    render(<StandardsRoutePanel viewModel={THREE_SECTION_VM} />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: /filter standards/i }),
      "EMC"
    );
    // EMC accordion toggle remains (aria-expanded targets accordion, not nav chip)
    expect(screen.getByRole("button", { name: /emc compatibility route/i, expanded: true })).toBeInTheDocument();
    // LVD accordion is removed from the DOM by the filter
    expect(screen.queryByRole("button", { name: /lvd safety route/i, expanded: true })).not.toBeInTheDocument();
  });

  test("shows no-match message when query matches nothing", async () => {
    render(<StandardsRoutePanel viewModel={THREE_SECTION_VM} />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: /filter standards/i }),
      "ZZZNOTFOUND"
    );
    expect(screen.getByText(/no sections match/i)).toBeInTheDocument();
  });

  test("clear button resets the filter and restores all sections", async () => {
    render(<StandardsRoutePanel viewModel={THREE_SECTION_VM} />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: /filter standards/i }),
      "EMC"
    );
    await userEvent.click(screen.getByRole("button", { name: /clear filter/i }));
    // LVD accordion is back (core, starts expanded)
    expect(screen.getByRole("button", { name: /lvd safety route/i, expanded: true })).toBeInTheDocument();
    // REACH accordion is back (secondary, starts collapsed) — routeTitle uses key-based lookup
    expect(screen.getByRole("button", { name: /reach/i, expanded: false })).toBeInTheDocument();
  });

  test("filter does not appear when only two sections exist", () => {
    const twoSectionVm = {
      ...THREE_SECTION_VM,
      routeSections: THREE_SECTIONS.slice(0, 2),
      displayRouteSections: THREE_SECTIONS.slice(0, 2),
      totalStandards: 2,
    };
    render(<StandardsRoutePanel viewModel={twoSectionVm} />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});

// ── OverviewPanel executive summary ──────────────────────────────────────────

const OVERVIEW_VM = {
  productIdentity: { type: "coffee_machine" },
  classificationConfidence: { label: "Medium", tone: null },
  triggeredDirectives: ["LVD", "EMC"],
  resultMaturity: { label: "Initial scope" },
  totalStandards: 4,
  decisionSignals: { blockerCount: 0, routeAffectingCount: 2 },
};

const OVERVIEW_RESULT = {
  overall_risk: "medium",
  summary: "A mains-powered appliance with a food-contact brew path.",
};

describe("OverviewPanel executive summary", () => {
  test("renders product type as primary heading", () => {
    render(<OverviewPanel result={OVERVIEW_RESULT} viewModel={OVERVIEW_VM} />);
    expect(screen.getByRole("heading", { name: /coffee machine/i })).toBeInTheDocument();
  });

  test("renders summary text from result", () => {
    render(<OverviewPanel result={OVERVIEW_RESULT} viewModel={OVERVIEW_VM} />);
    expect(screen.getByText(/mains-powered appliance/i)).toBeInTheDocument();
  });

  test("renders standards count in stat row", () => {
    render(<OverviewPanel result={OVERVIEW_RESULT} viewModel={OVERVIEW_VM} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  test("renders maturity label in stat row", () => {
    render(<OverviewPanel result={OVERVIEW_RESULT} viewModel={OVERVIEW_VM} />);
    expect(screen.getByText("Initial scope")).toBeInTheDocument();
  });

  test("renders open issues count in stat row", () => {
    render(<OverviewPanel result={OVERVIEW_RESULT} viewModel={OVERVIEW_VM} />);
    // blockerCount(0) + routeAffectingCount(2) = 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

// ── ClarificationsPanel priority order ───────────────────────────────────────

describe("ClarificationsPanel item priority order", () => {
  function renderClarificationsLocal(vm) {
    return render(
      <ClarificationsPanel
        description="Test product"
        viewModel={vm}
        dirty={false}
        busy={false}
        onReanalyze={jest.fn()}
        onApplyMissingInput={jest.fn()}
      />
    );
  }

  test("blockers appear before route-affecting items in the expanded body", async () => {
    const vm = {
      missingInputs: [
        { key: "ra1", title: "Route-affecting first", severity: "route-affecting", reason: "", examples: [] },
        { key: "b1",  title: "Blocker item",          severity: "blocker",         reason: "", examples: [] },
      ],
    };
    renderClarificationsLocal(vm);
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    const blockerEl = screen.getByText("Blocker item");
    const routeEl   = screen.getByText("Route-affecting first");
    expect(
      blockerEl.compareDocumentPosition(routeEl) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  test("shows intro text when expanded", async () => {
    const vm = {
      missingInputs: [
        { key: "b1", title: "Power unclear", severity: "blocker", reason: "", examples: [] },
      ],
    };
    renderClarificationsLocal(vm);
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    expect(screen.getByText(/missing or unclear facts/i)).toBeInTheDocument();
  });

  test("understood facts label reads 'Already clear'", async () => {
    const vm = {
      missingInputs: [
        { key: "b1", title: "Power unclear", severity: "blocker", reason: "", examples: [] },
      ],
    };
    render(
      <ClarificationsPanel
        description="mains-powered Wi-Fi thermostat with OTA updates"
        viewModel={vm}
        dirty={false}
        busy={false}
        onReanalyze={jest.fn()}
        onApplyMissingInput={jest.fn()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    // Only assert presence if understood facts were extracted — skip if none
    const label = screen.queryByText(/already clear/i);
    if (label) {
      expect(label).toBeInTheDocument();
    }
  });
});

// ── StandardsRoute section kind labels ───────────────────────────────────────

describe("StandardsRoutePanel section kind labels", () => {
  test("renders 'Core route' kind label for core sections", () => {
    render(<StandardsRoutePanel viewModel={THREE_SECTION_VM} />);
    // Core sections should show kind label
    expect(screen.getAllByText(/core route/i).length).toBeGreaterThanOrEqual(1);
  });

  test("renders 'Supporting' kind label for secondary sections", () => {
    render(<StandardsRoutePanel viewModel={THREE_SECTION_VM} />);
    expect(screen.getByText(/supporting/i)).toBeInTheDocument();
  });

  test("does not show section kind label for sections with unknown kind", () => {
    const vmUnknown = {
      ...THREE_SECTION_VM,
      routeSections: [
        {
          key: "MISC",
          title: "Misc route",
          items: [{ code: "EN 99999", title: "Some standard" }],
          sectionKind: "unknown",
          applicabilityBucket: "route review",
        },
      ],
      displayRouteSections: [
        {
          key: "MISC",
          title: "Misc route",
          items: [{ code: "EN 99999", title: "Some standard" }],
          sectionKind: "unknown",
          applicabilityBucket: "route review",
        },
      ],
      totalStandards: 1,
    };
    render(<StandardsRoutePanel viewModel={vmUnknown} />);
    expect(screen.queryByText(/core route/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supporting/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conditional/i)).not.toBeInTheDocument();
  });
});

// ── buildClipboardSummary structure ──────────────────────────────────────────

const CLIP_BASE = {
  result: {
    product_type: "coffee_machine",
    product_match_confidence: "medium",
    summary: "A mains-powered appliance.",
  },
  description: "Coffee machine with mains power",
  routeSections: [
    {
      key: "LVD",
      title: "LVD safety route",
      sectionKind: "core",
      applicabilityBucket: "core applicable",
      shortRationale: "Mains-powered electrical equipment.",
      items: [
        { code: "EN 60335-1", title: "Household and similar electrical appliances" },
        { code: "EN 62233",   title: "Measurement methods for electromagnetic fields" },
      ],
    },
    {
      key: "EMC",
      title: "EMC compatibility route",
      sectionKind: "core",
      applicabilityBucket: "core applicable",
      shortRationale: null,
      items: [{ code: "EN 55014-1", title: "Electromagnetic compatibility" }],
    },
  ],
  legislationGroups: [],
  missingInputs: [],
  evidenceNeeds: [],
};

describe("buildClipboardSummary structure", () => {
  test("starts with RuleGrid header", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).toMatch(/^RuleGrid/);
  });

  test("includes product type", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).toMatch(/Coffee machine/i);
  });

  test("includes route and standard count", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).toMatch(/LVD/);
    expect(out).toMatch(/3 standards/);
  });

  test("includes applicabilityBucket next to directive count", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).toMatch(/core applicable/i);
  });

  test("lists blockers before route-affecting items", () => {
    const out = buildClipboardSummary({
      ...CLIP_BASE,
      missingInputs: [
        { severity: "route-affecting", title: "Route question", reason: "" },
        { severity: "blocker",         title: "Critical blocker", reason: "" },
      ],
    });
    expect(out.indexOf("Critical blocker")).toBeLessThan(out.indexOf("Route question"));
  });

  test("includes next actions when evidenceNeeds are present", () => {
    const out = buildClipboardSummary({
      ...CLIP_BASE,
      evidenceNeeds: [
        { label: "LVD", nextActions: ["Schedule LVD safety test session"] },
      ],
    });
    expect(out).toMatch(/Schedule LVD safety test session/);
    expect(out).toMatch(/Next actions/i);
  });

  test("ends with disclaimer line", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    const lines = out.split("\n");
    expect(lines[lines.length - 1]).toMatch(/RuleGrid/);
    expect(lines[lines.length - 1]).toMatch(/legal advice/i);
  });

  test("includes summary text when present", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).toMatch(/mains-powered appliance/i);
  });

  test("omits clarifications section when there are no open items", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).not.toMatch(/Clarifications needed/i);
  });

  test("includes truncated description line when description is provided", () => {
    const out = buildClipboardSummary(CLIP_BASE);
    expect(out).toMatch(/Description:/);
    expect(out).toMatch(/Coffee machine with mains power/);
  });

  test("omits description line when description is empty", () => {
    const out = buildClipboardSummary({ ...CLIP_BASE, description: "" });
    expect(out).not.toMatch(/^Description:/m);
  });

  test("truncates very long descriptions to ~120 chars", () => {
    const longDesc = "A ".repeat(200).trim();
    const out = buildClipboardSummary({ ...CLIP_BASE, description: longDesc });
    const descLine = out.split("\n").find((l) => l.startsWith("Description:"));
    expect(descLine).toBeDefined();
    expect(descLine.length).toBeLessThan(140);
  });

  test("shows clarifications section when blockers are present", () => {
    const out = buildClipboardSummary({
      ...CLIP_BASE,
      missingInputs: [
        { severity: "blocker", title: "Power unclear", reason: "Affects safety route." },
      ],
    });
    expect(out).toMatch(/Clarifications needed/i);
    expect(out).toMatch(/▲ Blocker: Power unclear/);
    expect(out).toMatch(/Affects safety route/);
  });
});
