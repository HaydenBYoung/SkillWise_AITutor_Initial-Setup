import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIFeedbackForm from '../AIFeedbackForm';

jest.mock('../../services/api', () => ({
  apiService: {
    ai: {
      submitForFeedback: jest.fn(),
    },
  },
}));

import { apiService } from '../../services/api';

test('reads uploaded text file and sends its content to backend', async () => {
  const content = 'def foo():\n    return "bar"';
  const file = new File([content], 'test.py', { type: 'text/x-python' });
  const mockResponse = {
    success: true,
    data: { id: 999 },
    ai: { summary: 'Parsed' },
  };
  apiService.ai.submitForFeedback.mockResolvedValueOnce(mockResponse);

  render(<AIFeedbackForm />);

  const fileInput = screen.getByTestId('file-input');
  // upload file
  await userEvent.upload(fileInput, file);

  const btn = screen.getByRole('button', { name: /submit for ai feedback/i });
  userEvent.click(btn);

  await waitFor(() =>
    expect(apiService.ai.submitForFeedback).toHaveBeenCalledTimes(1)
  );

  // verify payload contains the file text
  const calledWith = apiService.ai.submitForFeedback.mock.calls[0][0];
  expect(calledWith).toHaveProperty('submission_text');
  expect(calledWith.submission_text).toContain('def foo()');

  expect(await screen.findByText(/ai feedback summary/i)).toBeInTheDocument();
});
