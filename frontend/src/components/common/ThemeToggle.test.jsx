import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  test('renders and toggles title/aria-label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle dark mode/i });
    expect(button).toBeInTheDocument();
    const initialTitle = button.getAttribute('title');

    fireEvent.click(button);
    const toggledTitle = button.getAttribute('title');

    expect(initialTitle).not.toEqual(toggledTitle);
  });
});
