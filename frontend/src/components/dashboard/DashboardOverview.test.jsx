/* eslint-env jest */
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import DashboardOverview from './DashboardOverview';

describe('DashboardOverview', () => {
  test('renders three stat cards and uses a three-column grid', () => {
    const { container } = render(<DashboardOverview />);

    // Labels exist
    expect(screen.getByText(/Goals Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Challenges Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Streak/i)).toBeInTheDocument();

    // Check the grid container has Tailwind three-column class
    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeTruthy();
  });
});
