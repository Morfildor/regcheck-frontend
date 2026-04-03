/**
 * Smoke test: verify the app shell renders without crashing on the analyze route.
 *
 * Full analyzer integration flows live in src/__tests__/analyzerIntegration.test.jsx.
 * Component-level tests live in src/__tests__/components.test.jsx and analyzerBehavior.test.jsx.
 */

import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ traits: [], products: [], legislations: [] }),
  });
  Object.defineProperty(window, "scrollTo", { configurable: true, value: jest.fn() });
});

afterEach(() => jest.resetAllMocks());

test("analyze route renders the workspace shell", async () => {
  window.history.pushState({}, "", "/analyze");
  render(<App />);
  expect(await screen.findByRole("heading", { name: /describe the product/i })).toBeInTheDocument();
});
