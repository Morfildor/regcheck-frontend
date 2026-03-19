import { render, screen } from '@testing-library/react';
import App from './App';

test('renders RuleGrid application', () => {
  render(<App />);
  const headingElement = screen.getByText(/Describe your product/i);
  expect(headingElement).toBeInTheDocument();
});
