import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChallengesPage from '../ChallengesPage';

// Mock apiService used by ChallengesPage and GenerateChallengeModal
jest.mock('../../services/api', () => {
  const apiService = {
    challenges: {
      getAll: jest.fn().mockResolvedValueOnce([
        {
          id: 'c1',
          title: 'Existing Challenge',
          description: 'An already existing challenge',
          tags: ['test'],
          difficulty: 'easy',
        },
      ]),
    },
    ai: {
      generateChallenge: jest.fn(),
    },
    user: {
      getProfile: jest.fn(),
    },
    auth: {},
  };

  return {
    apiService,
    getAccessToken: jest.fn(() => null),
    setAccessToken: jest.fn(),
    clearTokens: jest.fn(),
  };
});

import { apiService } from '../../services/api';
import { AuthProvider } from '../../contexts/AuthContext';

describe('ChallengesPage integration (AI generate flow)', () => {
  afterEach(() => jest.clearAllMocks());

  it('opens generate modal from page header, calls AI and renders result', async () => {
    // Prepare mock AI response
    const mockResp = {
      success: true,
      data: {
        parsed: {
          title: 'Generated Challenge Title',
          description: 'Generated description of the challenge',
          instructions: 'Do something useful',
          tags: ['generated', 'ai'],
          difficulty: 'medium',
        },
      },
    };

    apiService.ai.generateChallenge.mockResolvedValueOnce(mockResp);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ChallengesPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the challenges list to load
    await waitFor(() =>
      expect(apiService.challenges.getAll).toHaveBeenCalled()
    );

    // Click the Generate Challenge button in the header
    const genButton = screen.getByRole('button', {
      name: /Generate Challenge/i,
    });
    fireEvent.click(genButton);

    // Modal should appear with Title input
    expect(await screen.findByLabelText(/Title/i)).toBeInTheDocument();

    // Fill Title and submit
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Some Title' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Generate$/i }));

    // Ensure AI API was called and result rendered
    await waitFor(() =>
      expect(apiService.ai.generateChallenge).toHaveBeenCalled()
    );

    expect(
      await screen.findByText(/Generated Challenge Title/)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Generated description of the challenge/)
    ).toBeInTheDocument();
  });
});
