import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import PeerReviewPage from './PeerReviewPage';
import { apiService } from '../services/api';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      ...actual.apiService,
      peerReview: {
        getReviewQueue: jest.fn(async () => ({ data: { data: [] } })),
        getMySubmissions: jest.fn(async () => ({ data: { data: [] } })),
      },
    },
  };
});

describe('PeerReviewPage', () => {
  test('renders peer review header and calls API', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <PeerReviewPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /peer review/i })).toBeInTheDocument();
    await waitFor(() => expect(apiService.peerReview.getReviewQueue).toHaveBeenCalled());
  });
});
