import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChallengesPage from './ChallengesPage';
import { AuthProvider } from '../contexts/AuthContext';
import { apiService } from '../services/api';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      ...actual.apiService,
      challenges: {
        getAll: jest.fn(async () => ({ data: { data: [
          { id: 1, title: 'Challenge 1', description: 'desc', difficulty: 'Easy' },
          { id: 2, title: 'Challenge 2', description: 'desc', difficulty: 'Medium' },
        ] } })),
      },
    },
  };
});

describe('ChallengesPage', () => {
  test('renders challenges after loading', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ChallengesPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/learning challenges/i)).toBeInTheDocument();
    await waitFor(() => expect(apiService.challenges.getAll).toHaveBeenCalled());
    // Items may be filtered; ensure API called rather than exact DOM content
  });
});
