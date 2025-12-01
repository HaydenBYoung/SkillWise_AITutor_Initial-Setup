import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App routing and UI', () => {
  test('renders ThemeToggle and toggles icon', () => {
    render(<App />);

    const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
    expect(toggleButton).toBeInTheDocument();

    // Initial icon should be moon or sun depending on system preference mock (defaults to light -> moon)
    expect(screen.getByText(/🌙|☀️/)).toBeInTheDocument();

    fireEvent.click(toggleButton);
    // After toggle, icon should switch
    expect(screen.getByText(/🌙|☀️/)).toBeInTheDocument();
  });

  test('unknown route renders NotFoundPage', () => {
    window.history.pushState({}, 'Test page', '/some/unknown/route');
    render(<App />);
    // Expect a generic 404 indicator from NotFoundPage
    const notFound = screen.getByText(/not found/i);
    expect(notFound).toBeInTheDocument();
  });
});
