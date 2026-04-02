/**
 * Focused component-level regression tests.
 *
 * These tests exercise key result-page components in isolation, keeping
 * viewModel construction minimal. They complement the large integration
 * flows in App.test.js without duplicating them.
 *
 * Note: @testing-library/user-event v13 is used — import and call directly
 * (no `.setup()`) consistent with the rest of this project's test suite.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EvidencePanel from "../analyze/components/EvidencePanel";
import StandardsRoutePanel from "../analyze/components/StandardsRoute";
import ActionRequiredPanel from "../analyze/components/ActionRequiredPanel";

// ── EvidencePanel ────────────────────────────────────────────────────────────

const LVD_EVIDENCE = {
  key: "LVD",
  label: "LVD safety route",
  typicalEvidence: ["Safety test report", "Risk assessment document"],
  commonMissing: ["Power architecture not finalized", "Nameplate artwork absent"],
  blockers: ["No insulation or earthing drawings"],
  nextActions: ["Schedule LVD safety test session"],
};

const EVIDENCE_VIEWMODEL = { evidenceNeeds: [LVD_EVIDENCE] };

describe("EvidencePanel", () => {
  test("renders section heading", () => {
    render(<EvidencePanel viewModel={EVIDENCE_VIEWMODEL} />);
    expect(screen.getByRole("heading", { name: /evidence and common gaps/i })).toBeInTheDocument();
  });

  test("renders each evidence group by its label", () => {
    render(<EvidencePanel viewModel={EVIDENCE_VIEWMODEL} />);
    expect(screen.getByText("LVD safety route")).toBeInTheDocument();
  });

  test("renders typical evidence items", () => {
    render(<EvidencePanel viewModel={EVIDENCE_VIEWMODEL} />);
    expect(screen.getByText("Safety test report")).toBeInTheDocument();
    expect(screen.getByText("Risk assessment document")).toBeInTheDocument();
  });

  test("renders common gap items", () => {
    render(<EvidencePanel viewModel={EVIDENCE_VIEWMODEL} />);
    expect(screen.getByText("Power architecture not finalized")).toBeInTheDocument();
  });

  test("renders blocker items", () => {
    render(<EvidencePanel viewModel={EVIDENCE_VIEWMODEL} />);
    expect(screen.getByText("No insulation or earthing drawings")).toBeInTheDocument();
  });

  test("renders next action items", () => {
    render(<EvidencePanel viewModel={EVIDENCE_VIEWMODEL} />);
    expect(screen.getByText("Schedule LVD safety test session")).toBeInTheDocument();
  });

  test("shows empty-state copy when evidenceNeeds is empty", () => {
    render(<EvidencePanel viewModel={{ evidenceNeeds: [] }} />);
    expect(screen.getByText(/no evidence prompts/i)).toBeInTheDocument();
  });

  test("renders multiple evidence groups", () => {
    const viewModel = {
      evidenceNeeds: [
        LVD_EVIDENCE,
        {
          key: "EMC",
          label: "EMC compatibility route",
          typicalEvidence: ["Emissions test report"],
          commonMissing: [],
          blockers: [],
          nextActions: [],
        },
      ],
    };
    render(<EvidencePanel viewModel={viewModel} />);
    expect(screen.getByText("LVD safety route")).toBeInTheDocument();
    expect(screen.getByText("EMC compatibility route")).toBeInTheDocument();
  });
});

// ── StandardsRoutePanel ──────────────────────────────────────────────────────

const LVD_SECTION = {
  key: "LVD",
  title: "LVD safety route",
  items: [
    {
      code: "EN 60335-1",
      title: "Household and similar electrical appliances",
      harmonized_reference: "2014/C 389/03",
      dated_version: "EN 60335-1:2012",
    },
    { code: "EN 62233", title: "Measurement methods for electromagnetic fields" },
  ],
  sectionKind: "core",
  applicabilityBucket: "core applicable",
  shortRationale: "Mains-powered electrical equipment within voltage scope.",
};

const STANDARDS_VIEWMODEL = {
  routeSections: [LVD_SECTION],
  displayRouteSections: [LVD_SECTION],
  isRadioProduct: false,
  redGroup: null,
  totalStandards: 2,
};

describe("StandardsRoutePanel", () => {
  test("renders Standards heading", () => {
    render(<StandardsRoutePanel viewModel={STANDARDS_VIEWMODEL} />);
    expect(screen.getByRole("heading", { name: /^Standards$/i })).toBeInTheDocument();
  });

  test("renders the directive accordion toggle with aria-expanded", () => {
    render(<StandardsRoutePanel viewModel={STANDARDS_VIEWMODEL} />);
    // The accordion toggle has aria-expanded; the nav chip has aria-pressed.
    // Using expanded:true uniquely targets the accordion (core sections open by default).
    expect(screen.getByRole("button", { name: /lvd safety route/i, expanded: true })).toBeInTheDocument();
  });

  test("core sections start expanded and show standard codes", () => {
    render(<StandardsRoutePanel viewModel={STANDARDS_VIEWMODEL} />);
    expect(screen.getByText("EN 60335-1")).toBeInTheDocument();
    expect(screen.getByText("EN 62233")).toBeInTheDocument();
  });

  test("displays harmonized badge for standards with dated_version", () => {
    render(<StandardsRoutePanel viewModel={STANDARDS_VIEWMODEL} />);
    expect(screen.getByText("Harmonized")).toBeInTheDocument();
  });

  test("collapses section when accordion toggle is clicked", async () => {
    render(<StandardsRoutePanel viewModel={STANDARDS_VIEWMODEL} />);
    await userEvent.click(screen.getByRole("button", { name: /lvd safety route/i, expanded: true }));
    expect(screen.queryByText("EN 60335-1")).not.toBeInTheDocument();
  });

  test("shows empty-state copy when routeSections is empty", () => {
    const empty = {
      ...STANDARDS_VIEWMODEL,
      routeSections: [],
      displayRouteSections: [],
      totalStandards: 0,
    };
    render(<StandardsRoutePanel viewModel={empty} />);
    expect(screen.getByText(/no standards route/i)).toBeInTheDocument();
  });

  test("shows filter input when there are more than two route sections", () => {
    const sections = [
      LVD_SECTION,
      { ...LVD_SECTION, key: "EMC", title: "EMC compatibility route" },
      { ...LVD_SECTION, key: "REACH", title: "REACH material route" },
    ];
    const vm = { ...STANDARDS_VIEWMODEL, routeSections: sections, displayRouteSections: sections, totalStandards: 6 };
    render(<StandardsRoutePanel viewModel={vm} />);
    expect(screen.getByRole("searchbox", { name: /filter standards/i })).toBeInTheDocument();
  });
});

// ── ActionRequiredPanel (clarifications) ────────────────────────────────────

const CLARIFICATIONS_VIEWMODEL = {
  missingInputs: [
    {
      key: "wireless",
      title: "Confirm wireless connectivity",
      severity: "route-affecting",
      reason: "Wireless functions can trigger the Radio Equipment Directive.",
      examples: ["Wi-Fi connectivity", "Bluetooth"],
    },
    {
      key: "charger",
      title: "Confirm charger included",
      severity: "helpful",
      reason: "Bundled chargers require additional marking.",
      examples: ["battery supplied with the product"],
    },
  ],
};

function renderPanel(viewModelOverrides = {}, extraProps = {}) {
  return render(
    <ActionRequiredPanel
      description="Coffee machine"
      viewModel={{ ...CLARIFICATIONS_VIEWMODEL, ...viewModelOverrides }}
      dirty={false}
      busy={false}
      onReanalyze={jest.fn()}
      onApplyMissingInput={jest.fn()}
      {...extraProps}
    />
  );
}

describe("ActionRequiredPanel (clarifications)", () => {
  test("renders Clarifications toggle button", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /clarifications/i })).toBeInTheDocument();
  });

  test("shows route-affecting count pill in collapsed header", () => {
    renderPanel();
    expect(screen.getByText(/1 route-affecting/i)).toBeInTheDocument();
  });

  test("expands body on click and shows action items", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    expect(screen.getByText("Confirm wireless connectivity")).toBeInTheDocument();
    expect(screen.getByText(/wireless functions can trigger/i)).toBeInTheDocument();
  });

  test("example chips call onApplyMissingInput with the example text", async () => {
    const onApply = jest.fn();
    render(
      <ActionRequiredPanel
        description="Coffee machine"
        viewModel={CLARIFICATIONS_VIEWMODEL}
        dirty={false}
        busy={false}
        onReanalyze={jest.fn()}
        onApplyMissingInput={onApply}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    await userEvent.click(screen.getByRole("button", { name: /\+ wi-fi connectivity/i }));
    expect(onApply).toHaveBeenCalledWith("Wi-Fi connectivity");
  });

  test("returns nothing when there are no missing inputs and not dirty", () => {
    const { container } = render(
      <ActionRequiredPanel
        description="Coffee machine"
        viewModel={{ missingInputs: [] }}
        dirty={false}
        busy={false}
        onReanalyze={jest.fn()}
        onApplyMissingInput={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders blocker pill when blockers are present", () => {
    renderPanel({
      missingInputs: [
        {
          key: "power",
          title: "Power architecture unclear",
          severity: "blocker",
          reason: "Safety route depends on this.",
          examples: [],
        },
      ],
    });
    expect(screen.getByText(/1 blocker/i)).toBeInTheDocument();
  });

  test("shows stale notice inside expanded body when dirty", async () => {
    render(
      <ActionRequiredPanel
        description="Coffee machine with Wi-Fi"
        viewModel={CLARIFICATIONS_VIEWMODEL}
        dirty={true}
        busy={false}
        onReanalyze={jest.fn()}
        onApplyMissingInput={jest.fn()}
      />
    );
    // Stale notice only visible once expanded
    expect(screen.queryByText(/description changed/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
    expect(screen.getByText(/description changed/i)).toBeInTheDocument();
  });
});
