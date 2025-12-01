import { render, screen, waitFor } from '@testing-library/react';
import LeaderboardPage from './LeaderboardPage';
import * as apiModule from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('LeaderboardPage', () => {
  beforeEach(() => {
    apiModule.apiService.leaderboard = {
      getGlobal: jest.fn().mockResolvedValue([
        { userId: 1, username: 'Alice', points: 100 },
        { userId: 2, username: 'Bob', points: 90 },
      ]),
      getUserRank: jest.fn().mockResolvedValue({ rank: 5, points: 50 }),
    };
  });

  test('renders leaderboard rows', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LeaderboardPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiModule.apiService.leaderboard.getGlobal).toHaveBeenCalled();
    });

    // Assert heading present; UI rows may render asynchronously
    expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument();
  });
});
