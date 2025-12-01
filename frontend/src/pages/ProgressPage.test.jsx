import { render, screen, waitFor } from '@testing-library/react';
import ProgressPage from './ProgressPage';
import * as apiModule from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// No spyOn property; directly override methods below

describe('ProgressPage', () => {
  beforeEach(() => {
    apiModule.apiService.progress = {
      getOverview: jest.fn().mockResolvedValue({ points: 42, completed: 5 }),
      getSkills: jest.fn().mockResolvedValue([{ name: 'JS', level: 3 }]),
      getActivity: jest.fn().mockResolvedValue([{ type: 'challenge', id: 1 }]),
      getStats: jest.fn().mockResolvedValue({ streak: 7 }),
    };
  });

  test('renders overview data', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProgressPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiModule.apiService.progress.getOverview).toHaveBeenCalled();
    });

    // Loading spinner should eventually disappear after data load
    await waitFor(() => {
      expect(screen.queryByText(/loading your progress/i)).not.toBeInTheDocument();
    });
  });
});
