import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIFeedbackForm from '../AIFeedbackForm';

// Mock apiService.ai.submitForFeedback
jest.mock('../../services/api', () => ({
  apiService: {
    ai: {
      submitForFeedback: jest.fn(),
    },
  },
}));

import { apiService } from '../../services/api';

describe('AIFeedbackForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form elements', () => {
    render(<AIFeedbackForm />);
    expect(
      screen.getByPlaceholderText(/paste your submission text/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/upload a text file/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit for ai feedback/i })
    ).toBeInTheDocument();
  });

  test('shows validation when no input provided', async () => {
    render(<AIFeedbackForm />);
    const btn = screen.getByRole('button', { name: /submit for ai feedback/i });
    await userEvent.click(btn);
    expect(
      await screen.findByText(/please provide text or upload a file/i)
    ).toBeInTheDocument();
  });

  test('rejects unsupported file types', async () => {
    render(<AIFeedbackForm />);
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['%PDF-1.4'], 'file.pdf', {
      type: 'application/pdf',
    });
    // fire change event directly to ensure files are set in JSDOM
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(
      await screen.findByText(/unsupported file type/i)
    ).toBeInTheDocument();
  });

  test('submits text and displays result', async () => {
    const mockResponse = {
      success: true,
      data: { id: 123 },
      ai: { summary: 'Good job', reportUrl: 'http://report' },
    };
    apiService.ai.submitForFeedback.mockResolvedValueOnce(mockResponse);

    render(<AIFeedbackForm />);
    const textarea = screen.getByPlaceholderText(/paste your submission text/i);
    await userEvent.type(textarea, 'console.log("hello world")');
    const btn = screen.getByRole('button', { name: /submit for ai feedback/i });
    await userEvent.click(btn);

    await waitFor(() =>
      expect(apiService.ai.submitForFeedback).toHaveBeenCalledTimes(1)
    );

    expect(await screen.findByText(/ai feedback summary/i)).toBeInTheDocument();
    expect(screen.getByText(/good job/i)).toBeInTheDocument();
    expect(screen.getByText(/open full ai report/i)).toHaveAttribute(
      'href',
      'http://report'
    );
  });
});
