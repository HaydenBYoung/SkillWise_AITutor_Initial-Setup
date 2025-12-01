import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AchievementsPage from './AchievementsPage';

describe('AchievementsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => [{ id: 1, title: 'Starter', description: 'First badge' }],
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('shows loading then renders achievements', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AchievementsPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/loading achievements/i)).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(await screen.findByRole('heading', { name: /achievements/i })).toBeInTheDocument();
  });
});
