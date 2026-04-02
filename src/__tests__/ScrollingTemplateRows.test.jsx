/**
 * Focused crash-guard tests for ScrollingTemplateRows.
 *
 * The component uses browser-only APIs (ResizeObserver, requestAnimationFrame,
 * document.hidden). These tests verify that the stubs in setupTests.js are
 * sufficient to prevent the component from throwing in the JSDOM test
 * environment — any uncaught throw here means the stub coverage is incomplete.
 */

import { render } from "@testing-library/react";
import ScrollingTemplateRows from "../analyze/ScrollingTemplateRows";

const SAMPLE_TEMPLATES = [
  { label: "Coffee machine", text: "Coffee machine with mains power and food-contact brew path" },
  { label: "Smart thermostat", text: "Smart thermostat with Wi-Fi and 24 V DC supply" },
  { label: "Router", text: "Wi-Fi 6 router with PoE ports and cloud management dashboard" },
];

test("renders without crashing when templates are provided (ResizeObserver + rAF stubs active)", () => {
  expect(() =>
    render(<ScrollingTemplateRows templates={SAMPLE_TEMPLATES} onSelect={() => {}} />)
  ).not.toThrow();
});

test("renders without crashing when templates is an empty array (uses DEFAULT_TEMPLATES fallback)", () => {
  expect(() =>
    render(<ScrollingTemplateRows templates={[]} onSelect={() => {}} />)
  ).not.toThrow();
});

test("renders without crashing when templates prop is undefined (uses DEFAULT_TEMPLATES fallback)", () => {
  expect(() =>
    render(<ScrollingTemplateRows templates={undefined} onSelect={() => {}} />)
  ).not.toThrow();
});
