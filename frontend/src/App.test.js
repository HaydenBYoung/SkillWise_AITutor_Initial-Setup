import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock react-hot-toast since it might cause issues in tests
jest.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Wrap App with BrowserRouter for testing
const AppWithRouter = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

test('renders SkillWise app without crashing', () => {
  render(<AppWithRouter />);
  
  // Should render the main app
  expect(document.body).toBeInTheDocument();
});

test('app contains SkillWise branding', () => {
  render(<AppWithRouter />);
  
  // Look for SkillWise text anywhere in the document
  const skillwiseElements = screen.getAllByText(/skillwise/i);
  expect(skillwiseElements.length).toBeGreaterThan(0);
});