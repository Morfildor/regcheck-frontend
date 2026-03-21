import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ traits: [], products: [], legislations: [] }),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test("renders the product analysis workspace", async () => {
  render(<App />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  expect(
    screen.getByRole("heading", {
      name: /professional regulatory scoping for complex product decisions/i,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: /analyze product/i })
  ).toBeInTheDocument();
});
