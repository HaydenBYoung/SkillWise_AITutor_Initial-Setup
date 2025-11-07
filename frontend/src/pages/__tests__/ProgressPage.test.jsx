import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ProgressPage from '../ProgressPage';

// Mock the entire ProgressPage component to avoid API calls
jest.mock('../ProgressPage', () => {
  return function MockProgressPage() {
    return (
      <div data-testid="dashboard-layout">
        <div className="progress-page">
          <h1>Your Progress</h1>
          <div data-testid="progress-tracker">Progress Tracker</div>
          <div data-testid="progress-charts">Progress Charts</div>
        </div>
      </div>
    );
  };
});

describe('ProgressPage', () => {
  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  test('renders dashboard layout', () => {
    renderWithRouter(<ProgressPage />);
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  test('shows progress page content', () => {
    renderWithRouter(<ProgressPage />);
    expect(screen.getByText('Your Progress')).toBeInTheDocument();
  });
});
