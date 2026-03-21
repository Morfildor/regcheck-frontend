import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

function jsonResponse(data, ok = true) {
  return {
    ok,
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

function buildResult(summary) {
  return {
    summary,
    product_type: "coffee_machine",
    product_match_confidence: "medium",
    overall_risk: "MEDIUM",
    standard_sections: [
      {
        key: "LVD",
        title: "LVD safety route",
        items: [
          {
            code: "EN 60335-1",
            title: "Household and similar electrical appliances",
            harmonization_status: "harmonized",
            harmonized_reference: "2014/C 389/03",
            dated_version: "EN 60335-1:2012",
            version: "EN IEC 60335-1:2023",
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
            harmonization_status: "harmonized",
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
    ],
    missing_information_items: [
      {
        key: "food_contact_materials",
        message: "Confirm wetted materials",
        importance: "medium",
        examples: ["food-contact plastics"],
      },
    ],
    all_traits: ["food_contact"],
    suggested_quick_adds: [],
  };
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
});

afterEach(() => {
  jest.resetAllMocks();
});

test("renders the current landing workspace", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve(jsonResponse({ traits: [], products: [], legislations: [] }))
  );

  render(<App />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  expect(
    screen.getByRole("heading", {
      name: /eu regulatory scoping, instantly/i,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: /analyze product/i })
  ).toBeInTheDocument();
});

test("does not restore an aborted rerun after starting over", async () => {
  const rerun = deferred();

  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse({ traits: [], products: [], legislations: [] }))
    .mockResolvedValueOnce(jsonResponse(buildResult("Alpha summary")))
    .mockImplementationOnce(() => rerun.promise);

  render(<App />);

  fireEvent.change(screen.getByRole("textbox", { name: /describe your product/i }), {
    target: { value: "Connected coffee machine with mains power and food-contact brew path" },
  });
  fireEvent.click(screen.getByRole("button", { name: /analyze product/i }));

  expect(await screen.findAllByText("Alpha summary")).not.toHaveLength(0);

  fireEvent.click(screen.getByRole("button", { name: /analyze product/i }));
  fireEvent.click(screen.getByRole("button", { name: /new analysis/i }));

  expect(
    screen.getByRole("heading", {
      name: /eu regulatory scoping, instantly/i,
    })
  ).toBeInTheDocument();

  await act(async () => {
    rerun.resolve(jsonResponse(buildResult("Beta summary")));
    await Promise.resolve();
    await Promise.resolve();
  });

  await waitFor(() => {
    expect(screen.queryByText("Beta summary")).not.toBeInTheDocument();
  });
});

test("resets result-scoped panel state on a new analysis", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse({ traits: [], products: [], legislations: [] }))
    .mockResolvedValueOnce(jsonResponse(buildResult("First summary")))
    .mockResolvedValueOnce(jsonResponse(buildResult("Second summary")));

  render(<App />);

  fireEvent.change(screen.getByRole("textbox", { name: /describe your product/i }), {
    target: { value: "Connected coffee machine with mains power and food-contact brew path" },
  });
  fireEvent.click(screen.getByRole("button", { name: /analyze product/i }));

  expect(await screen.findAllByText("First summary")).not.toHaveLength(0);
  expect(
    screen.getByText(/household and similar electrical appliances/i)
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /lvd safety route/i }));

  await waitFor(() => {
    expect(
      screen.queryByText(/household and similar electrical appliances/i)
    ).not.toBeInTheDocument();
  });

  fireEvent.click(screen.getAllByRole("button", { name: /\+ food-contact plastics/i })[0]);
  expect(screen.getByText(/^Applied$/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /analyze product/i }));

  expect(await screen.findAllByText("Second summary")).not.toHaveLength(0);
  expect(screen.queryByText(/^Applied$/)).not.toBeInTheDocument();
  expect(
    screen.getByText(/household and similar electrical appliances/i)
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: /\+ food-contact plastics/i })[0]
  ).toBeEnabled();
});
