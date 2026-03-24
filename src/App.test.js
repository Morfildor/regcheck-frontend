import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

jest.setTimeout(15000);

function jsonResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  };
}

function deferred() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function buildMetadata() {
  return {
    traits: [],
    products: [
      { id: "coffee_machine", label: "Coffee machine" },
      { id: "router", label: "Router" },
      { id: "smart_display", label: "Smart display" },
    ],
    legislations: [],
  };
}

function buildResult(summary, overrides = {}) {
  return {
    summary,
    product_type: "coffee_machine",
    product_family: "household_appliance",
    product_subtype: "espresso_machine",
    product_match_confidence: "medium",
    product_match_stage: "family",
    overall_risk: "MEDIUM",
    standard_sections: [
      {
        key: "LVD",
        title: "LVD safety route",
        items: [
          {
            code: "EN 60335-1",
            title: "Household and similar electrical appliances",
            harmonized_reference: "2014/C 389/03",
            dated_version: "EN 60335-1:2012",
            version: "EN IEC 60335-1:2023",
          },
          {
            code: "EN 62233",
            title: "Measurement methods for electromagnetic fields",
          },
        ],
      },
      {
        key: "EMC",
        title: "EMC compatibility route",
        items: [
          {
            code: "EN 55014-1",
            title: "Electromagnetic compatibility requirements",
          },
        ],
      },
    ],
    legislation_sections: [
      {
        key: "ce",
        title: "CE",
        items: [
          {
            code: "2014/35/EU",
            title: "Low Voltage Directive",
            directive_key: "LVD",
          },
          {
            code: "2014/30/EU",
            title: "Electromagnetic Compatibility Directive",
            directive_key: "EMC",
          },
        ],
      },
      {
        key: "non_ce",
        title: "Parallel",
        items: [
          {
            code: "1907/2006",
            title: "REACH",
            directive_key: "REACH",
            rationale: "Material composition and SVHC status can still change the release decision.",
            scope: "Applies to all articles placed on the EU market.",
          },
        ],
      },
    ],
    missing_information_items: [
      {
        key: "wireless_connectivity",
        message: "Confirm wireless connectivity",
        importance: "high",
        examples: ["Wi-Fi connectivity"],
      },
      {
        key: "charger_included",
        message: "Confirm charger included",
        importance: "medium",
        examples: ["battery supplied with the product"],
      },
    ],
    all_traits: ["food_contact"],
    suggested_quick_adds: [
      {
        label: "Cloud account",
        text: "cloud account and user login",
      },
    ],
    future_watchlist: ["cyber resilience act"],
    ...overrides,
  };
}

function renderAt(route = "/analyze") {
  window.history.pushState({}, "", route);
  return render(<App />);
}

async function submitAnalysis(description) {
  await userEvent.clear(screen.getByRole("textbox", { name: /describe your product/i }));
  await userEvent.type(
    screen.getByRole("textbox", { name: /describe your product/i }),
    description
  );
  await userEvent.click(screen.getByRole("button", { name: /analyze product|analyze again|re-run analysis/i }));
}

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test("renders the home page and navigates into the analyzer", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(jsonResponse(buildMetadata()));

  renderAt("/");

  expect(
    screen.getByRole("heading", {
      name: /move from rough product detail to a defensible eu starting route/i,
    })
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: /open analyzer/i }));

  expect(
    await screen.findByRole("heading", {
      name: /describe the product/i,
    })
  ).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("renders trust-first analyzer hierarchy and copies the analysis summary", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockResolvedValueOnce(jsonResponse(buildResult("Initial scope for a connected coffee machine.")));

  renderAt("/analyze");

  await submitAnalysis(
    "Connected coffee machine with mains power, grinder, pressure, and food-contact brew path"
  );

  expect(await screen.findByText(/initial scope for a connected coffee machine/i)).toBeInTheDocument();
  expect(screen.getAllByText(/^Initial scope$/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/^Preliminary only$/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/mains-powered electrical equipment within voltage scope/i)).toBeInTheDocument();
  expect(screen.getByText(/^Clarifications$/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /^Standards route$/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /^Parallel obligations$/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /evidence and common gaps/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /^Supporting context$/i })).toBeInTheDocument();

  await act(async () => {
    await userEvent.click(screen.getAllByRole("button", { name: /^copy$/i })[0]);
  });

  expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
});

test("clarification apply marks the result stale, rerun replaces it cleanly, and panel state resets", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockResolvedValueOnce(jsonResponse(buildResult("First result summary.")))
    .mockResolvedValueOnce(
      jsonResponse(
        buildResult("Second result summary.", {
          product_match_confidence: "high",
          standard_sections: [
            {
              key: "LVD",
              title: "LVD safety route",
              items: [
                {
                  code: "EN 60335-1",
                  title: "Household and similar electrical appliances",
                },
              ],
            },
            {
              key: "RED",
              title: "RED wireless route",
              items: [
                {
                  code: "EN 300 328",
                  title: "Wideband transmission systems",
                },
              ],
            },
          ],
        })
      )
    );

  renderAt("/analyze");

  await submitAnalysis(
    "Connected coffee machine with mains power, grinder, pressure, and food-contact brew path"
  );

  expect(await screen.findByText(/first result summary/i)).toBeInTheDocument();
  expect(screen.getByText(/household and similar electrical appliances/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /lvd safety route/i, expanded: true }));
  await waitFor(() => {
    expect(screen.queryByText(/household and similar electrical appliances/i)).not.toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
  await userEvent.click(screen.getByRole("button", { name: /\+ wi-fi connectivity/i }));

  expect(screen.getByRole("textbox", { name: /describe your product/i }).value).toMatch(
    /wi-fi connectivity/i
  );
  expect(screen.getByText(/description updated\. re-run to apply the latest clarifications/i)).toBeInTheDocument();
  expect(screen.getByText(/first result summary/i)).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole("button", { name: /re-run analysis/i })[0]);

  expect(await screen.findByText(/second result summary/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /lvd safety route/i, expanded: true })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
  expect(screen.getByText(/compared with previous analysis/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /clarifications/i })).toHaveAttribute("aria-expanded", "false");
});

test("starting a new analyze aborts the prior in-flight request", async () => {
  const firstRun = deferred();
  let firstSignal;

  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockImplementationOnce((_, options) => {
      firstSignal = options.signal;
      return firstRun.promise;
    })
    .mockResolvedValueOnce(jsonResponse(buildResult("Second request result.")));

  renderAt("/analyze");

  await userEvent.type(
    screen.getByRole("textbox", { name: /describe your product/i }),
    "First product with mains power"
  );
  await userEvent.click(screen.getByRole("button", { name: /analyze product/i }));

  await userEvent.clear(screen.getByRole("textbox", { name: /describe your product/i }));
  await userEvent.type(
    screen.getByRole("textbox", { name: /describe your product/i }),
    "Second product with mains power and Wi-Fi"
  );
  await userEvent.click(screen.getByRole("button", { name: /analyze product|analyze again|re-run analysis/i }));

  expect(await screen.findByText(/second request result/i)).toBeInTheDocument();
  expect(firstSignal.aborted).toBe(true);

  await act(async () => {
    firstRun.resolve(jsonResponse(buildResult("Ignored first result.")));
    await Promise.resolve();
  });

  expect(screen.queryByText(/ignored first result/i)).not.toBeInTheDocument();
});

test("restore previous result and reset clear transient analyzer state", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockResolvedValueOnce(jsonResponse(buildResult("Alpha summary.")))
    .mockResolvedValueOnce(jsonResponse(buildResult("Beta summary.", { product_type: "router" })));

  renderAt("/analyze");

  await submitAnalysis("Alpha product with mains power");
  expect(await screen.findByText(/alpha summary/i)).toBeInTheDocument();

  fireEvent.change(screen.getByRole("textbox", { name: /describe your product/i }), {
    target: { value: "Beta product with mains power and Wi-Fi" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: /re-run analysis/i })[0]);

  expect(await screen.findByText(/beta summary/i)).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole("button", { name: /^previous$/i })[0]);

  expect(await screen.findByText(/alpha summary/i)).toBeInTheDocument();
  expect(screen.queryByText(/compared with previous analysis/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/description updated\. re-run/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /^reset$/i }));

  expect(screen.getByRole("textbox", { name: /describe your product/i })).toHaveValue("");
  expect(screen.queryByText(/alpha summary/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /restore previous result/i })).not.toBeInTheDocument();
});

test("shows an analysis error without breaking the workspace shell", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockResolvedValueOnce(jsonResponse({ detail: "Engine unavailable" }, false, 503));

  renderAt("/analyze");

  await submitAnalysis("Coffee machine with mains power");

  expect(await screen.findByText(/analysis error/i)).toBeInTheDocument();
  expect(screen.getByText(/engine unavailable/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /describe the product/i })).toBeInTheDocument();
});

test("keeps stable section order and mobile drawer behavior with partial backend data", async () => {
  window.innerWidth = 390;
  fireEvent(window, new Event("resize"));

  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockResolvedValueOnce(
      jsonResponse(
        buildResult("Partial result summary.", {
          standard_sections: [],
          standards: [
            {
              code: "EN 60335-1",
              title: "Household and similar electrical appliances",
              directive_key: "LVD",
            },
          ],
          legislation_sections: [],
        })
      )
    );

  const { container } = renderAt("/analyze");

  await submitAnalysis("Coffee machine with mains power");

  expect(await screen.findByText(/partial result summary/i)).toBeInTheDocument();

  const stickyActionBar = container.querySelector('[data-mobile-sticky="true"]');
  expect(stickyActionBar).not.toBeNull();

  const contextDetails = container.querySelector("details.contextPanel");
  expect(contextDetails).not.toBeNull();
  expect(contextDetails.open).toBe(false);

  const order = [
    screen.getByRole("heading", { name: /coffee machine/i }),
    container.querySelector("details.trustBar"),
    container.querySelector("section.clarificationStrip"),
    screen.getByRole("heading", { name: /^Standards route$/i }),
    screen.getByRole("heading", { name: /^Parallel obligations$/i }),
    screen.getByRole("heading", { name: /evidence and common gaps/i }),
    screen.getByRole("heading", { name: /^Supporting context$/i }),
  ];

  for (let index = 0; index < order.length - 1; index += 1) {
    const current = order[index];
    const next = order[index + 1];
    expect(current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

test("keyboard interaction works for accordions and clarification actions", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse(buildMetadata()))
    .mockResolvedValueOnce(jsonResponse(buildResult("Keyboard interaction result.")));

  renderAt("/analyze");

  await submitAnalysis("Coffee machine with mains power");

  expect(await screen.findByText(/keyboard interaction result/i)).toBeInTheDocument();

  const routeToggle = screen.getByRole("button", { name: /lvd safety route/i, expanded: true });
  routeToggle.focus();
  await userEvent.keyboard("{Enter}");

  await waitFor(() => {
    expect(screen.queryByText(/household and similar electrical appliances/i)).not.toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole("button", { name: /clarifications/i }));
  const clarificationButton = screen.getByRole("button", { name: /\+ wi-fi connectivity/i });
  clarificationButton.focus();
  await userEvent.keyboard("{Enter}");

  expect(screen.getByRole("textbox", { name: /describe your product/i }).value).toMatch(
    /wi-fi connectivity/i
  );
});
