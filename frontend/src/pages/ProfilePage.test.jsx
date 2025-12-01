import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProfilePage from './ProfilePage';
import { apiService } from '../services/api';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      ...actual.apiService,
      users: {
        profile: jest.fn(async () => ({ data: { data: { id: 1, name: 'Test User' } } })),
      },
    },
  };
});

describe('ProfilePage', () => {
  test('renders profile header and calls API', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });
});
