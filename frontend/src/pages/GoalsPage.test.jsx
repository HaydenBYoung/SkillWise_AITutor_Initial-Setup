import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GoalsPage from './GoalsPage';
import { AuthProvider } from '../contexts/AuthContext';
import { apiService } from '../services/api';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      ...actual.apiService,
      goals: {
        getAll: jest.fn(async () => ({ data: { data: [{ id: 1, title: 'Goal A' }, { id: 2, title: 'Goal B' }] } })),
      },
    },
  };
});

describe('GoalsPage', () => {
  test('renders goals list after loading', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <GoalsPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/my learning goals/i)).toBeInTheDocument();
    await waitFor(() => expect(apiService.goals.getAll).toHaveBeenCalled());
  });
});
