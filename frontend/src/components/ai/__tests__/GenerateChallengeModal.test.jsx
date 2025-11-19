import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenerateChallengeModal from '../GenerateChallengeModal';

// Mock the apiService to avoid real network calls
jest.mock('../../../services/api', () => ({
  apiService: {
    ai: {
      generateChallenge: jest.fn(),
    },
  },
}));

import { apiService } from '../../../services/api';

describe('GenerateChallengeModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits form and displays AI result', async () => {
    const mockResp = {
      success: true,
      data: {
        parsed: {
          title: 'Sum Numbers',
          description: 'Add numbers from input',
          instructions: 'Read input, output sum',
          tags: ['math', 'beginner'],
          difficulty: 'easy',
        },
      },
    };

    apiService.ai.generateChallenge.mockResolvedValueOnce(mockResp);

    const onClose = jest.fn();

    render(<GenerateChallengeModal onClose={onClose} />);

    // Fill minimal fields
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Sum Numbers' },
    });

    // Click the submit button (there's also a heading with "Generate Challenge")
    fireEvent.click(screen.getByRole('button', { name: /^Generate$/i }));

    // Wait for API call to be invoked and the result to render
    await waitFor(() =>
      expect(apiService.ai.generateChallenge).toHaveBeenCalled()
    );

    // Use findBy* which waits for the element to appear
    expect(await screen.findByText(/Sum Numbers/)).toBeInTheDocument();
    expect(await screen.findByText(/Difficulty:/)).toBeInTheDocument();
    expect(
      await screen.findByText(/Add numbers from input/)
    ).toBeInTheDocument();
  });
});
