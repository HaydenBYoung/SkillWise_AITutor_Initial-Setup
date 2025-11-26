// Unit tests for AIFeedbackForm component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIFeedbackForm from '../AIFeedbackForm';
import { apiService } from '../../../services/api';

// Mock the API service
jest.mock('../../../services/api');

describe('AIFeedbackForm', () => {
  const mockOnFeedbackReceived = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with all inputs', () => {
    render(
      <AIFeedbackForm
        submissionId={1}
        challengeTitle="Test Challenge"
        challengeDescription="Test description"
        onFeedbackReceived={mockOnFeedbackReceived}
      />
    );

    expect(screen.getByText('🤖 Get AI Feedback')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload code file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your code/i)).toBeInTheDocument();
    expect(screen.getByText('✨ Get AI Feedback')).toBeInTheDocument();
  });

  it('should handle code textarea input', async () => {
    render(<AIFeedbackForm />);

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'const x = 10;');

    expect(textarea.value).toBe('const x = 10;');
  });

  it('should handle file upload', async () => {
    render(<AIFeedbackForm />);

    const file = new File(['const test = 123;'], 'test.js', {
      type: 'text/javascript',
    });
    const input = screen.getByLabelText(/upload code file/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('📄 test.js')).toBeInTheDocument();
    });
  });

  it('should submit form and display feedback', async () => {
    const mockFeedback = {
      data: {
        id: 1,
        feedbackText: 'Great code!',
        confidenceScore: 0.95,
        strengths: ['Clean code', 'Good structure'],
        improvements: ['Add comments'],
        suggestions: ['Consider edge cases'],
        aiModel: 'gpt-3.5-turbo',
        processingTime: 1200,
      },
    };

    apiService.ai.submitForFeedback.mockResolvedValue(mockFeedback);

    render(
      <AIFeedbackForm
        submissionId={1}
        challengeTitle="Test Challenge"
        challengeDescription="Test description"
        onFeedbackReceived={mockOnFeedbackReceived}
      />
    );

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'const x = 10;');

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiService.ai.submitForFeedback).toHaveBeenCalledWith({
        submissionId: 1,
        submissionCode: 'const x = 10;',
        challengeTitle: 'Test Challenge',
        challengeDescription: 'Test description',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('📊 AI Feedback Results')).toBeInTheDocument();
      expect(screen.getByText('Great code!')).toBeInTheDocument();
      expect(screen.getByText('Clean code')).toBeInTheDocument();
      expect(screen.getByText('Good structure')).toBeInTheDocument();
      expect(screen.getByText('Add comments')).toBeInTheDocument();
      expect(screen.getByText('Consider edge cases')).toBeInTheDocument();
    });

    expect(mockOnFeedbackReceived).toHaveBeenCalledWith(mockFeedback.data);
  });

  it('should display loading state during submission', async () => {
    apiService.ai.submitForFeedback.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 1000))
    );

    render(<AIFeedbackForm />);

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'code here');

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    expect(screen.getByText('🔄 Analyzing...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should display error message on submission failure', async () => {
    apiService.ai.submitForFeedback.mockRejectedValue({
      response: { data: { message: 'API Error occurred' } },
    });

    render(<AIFeedbackForm />);

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'code here');

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/API Error occurred/i)).toBeInTheDocument();
    });
  });

  it('should not submit empty code', async () => {
    render(<AIFeedbackForm />);

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please provide code to review/i)
      ).toBeInTheDocument();
    });

    expect(apiService.ai.submitForFeedback).not.toHaveBeenCalled();
  });

  it('should display confidence score with progress bar', async () => {
    const mockFeedback = {
      data: {
        feedbackText: 'Good work',
        confidenceScore: 0.85,
        strengths: [],
        improvements: [],
        suggestions: [],
      },
    };

    apiService.ai.submitForFeedback.mockResolvedValue(mockFeedback);

    render(<AIFeedbackForm />);

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'code');

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    const progressBar = document.querySelector('.score-fill');
    expect(progressBar).toHaveStyle({ width: '85%' });
  });

  it('should allow submitting another after receiving feedback', async () => {
    const mockFeedback = {
      data: {
        feedbackText: 'Test feedback',
        confidenceScore: 0.9,
        strengths: [],
        improvements: [],
        suggestions: [],
      },
    };

    apiService.ai.submitForFeedback.mockResolvedValue(mockFeedback);

    render(<AIFeedbackForm />);

    // Submit first time
    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'code1');

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('📊 AI Feedback Results')).toBeInTheDocument();
    });

    // Click "Submit Another"
    const resetButton = screen.getByText('← Submit Another');
    fireEvent.click(resetButton);

    // Should show form again
    expect(
      screen.getByPlaceholderText(/paste your code here/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText('📊 AI Feedback Results')
    ).not.toBeInTheDocument();
  });

  it('should use timestamp as submissionId if not provided', async () => {
    const mockFeedback = {
      data: {
        feedbackText: 'Feedback',
        confidenceScore: 0.8,
        strengths: [],
        improvements: [],
        suggestions: [],
      },
    };

    apiService.ai.submitForFeedback.mockResolvedValue(mockFeedback);

    // Mock Date.now()
    const mockNow = 1234567890;
    jest.spyOn(Date, 'now').mockReturnValue(mockNow);

    render(<AIFeedbackForm />);

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    await userEvent.type(textarea, 'code');

    const submitButton = screen.getByText('✨ Get AI Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiService.ai.submitForFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId: mockNow,
        })
      );
    });

    Date.now.mockRestore();
  });

  it('should disable submit button when code is empty', () => {
    render(<AIFeedbackForm />);

    const submitButton = screen.getByText('✨ Get AI Feedback');
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when code is entered', async () => {
    render(<AIFeedbackForm />);

    const textarea = screen.getByPlaceholderText(/paste your code here/i);
    const submitButton = screen.getByText('✨ Get AI Feedback');

    expect(submitButton).toBeDisabled();

    await userEvent.type(textarea, 'some code');

    expect(submitButton).not.toBeDisabled();
  });
});
