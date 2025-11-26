// Unit tests for AIChallengeModal component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChallengeModal from '../AIChallengeModal';
import { apiService } from '../../../services/api';

// Mock the API service
jest.mock('../../../services/api');

describe('AIChallengeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnChallengeCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with form inputs', () => {
    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    expect(screen.getByText('🤖 AI Challenge Generator')).toBeInTheDocument();
    expect(screen.getByLabelText(/skill/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AIChallengeModal
        isOpen={false}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    expect(
      screen.queryByText('🤖 AI Challenge Generator')
    ).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle form submission and generate challenge', async () => {
    const mockChallenge = {
      data: {
        title: 'Test Challenge',
        description: 'This is a test challenge',
        difficulty: 'medium',
        category: 'JavaScript',
        estimatedTime: '30 minutes',
        examples: [{ input: 'test input', output: 'test output' }],
        acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
        aiModel: 'gpt-3.5-turbo',
        processingTime: 1500,
      },
    };

    apiService.ai.generateChallenge.mockResolvedValue(mockChallenge);

    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    // Fill out the form
    const skillSelect = screen.getByLabelText(/skill/i);
    const difficultySelect = screen.getByLabelText(/difficulty/i);
    const topicInput = screen.getByLabelText(/topic/i);
    const typeSelect = screen.getByLabelText(/type/i);

    await userEvent.selectOptions(skillSelect, 'JavaScript');
    await userEvent.selectOptions(difficultySelect, 'medium');
    await userEvent.type(topicInput, 'Array Manipulation');
    await userEvent.selectOptions(typeSelect, 'coding');

    // Submit the form
    const generateButton = screen.getByText('✨ Generate Challenge');
    fireEvent.click(generateButton);

    // Wait for API call and result
    await waitFor(() => {
      expect(apiService.ai.generateChallenge).toHaveBeenCalledWith({
        skill: 'JavaScript',
        difficulty: 'medium',
        topic: 'Array Manipulation',
        type: 'coding',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      expect(screen.getByText('This is a test challenge')).toBeInTheDocument();
    });
  });

  it('should display loading state during generation', async () => {
    apiService.ai.generateChallenge.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 1000))
    );

    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    const skillSelect = screen.getByLabelText(/skill/i);
    const topicInput = screen.getByLabelText(/topic/i);

    await userEvent.selectOptions(skillSelect, 'Python');
    await userEvent.type(topicInput, 'Testing');

    const generateButton = screen.getByText('✨ Generate Challenge');
    fireEvent.click(generateButton);

    expect(screen.getByText('🔄 Generating...')).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  it('should display error message when generation fails', async () => {
    apiService.ai.generateChallenge.mockRejectedValue({
      response: { data: { message: 'API Error' } },
    });

    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    const skillSelect = screen.getByLabelText(/skill/i);
    const topicInput = screen.getByLabelText(/topic/i);

    await userEvent.selectOptions(skillSelect, 'Java');
    await userEvent.type(topicInput, 'Testing');

    const generateButton = screen.getByText('✨ Generate Challenge');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    });
  });

  it('should require topic field to be filled', async () => {
    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    const generateButton = screen.getByText('✨ Generate Challenge');
    fireEvent.click(generateButton);

    // Should not call API without topic
    expect(apiService.ai.generateChallenge).not.toHaveBeenCalled();
  });

  it('should call onChallengeCreated when save button is clicked', async () => {
    const mockChallenge = {
      data: {
        title: 'Test Challenge',
        description: 'Test description',
        difficulty: 'easy',
        category: 'Python',
        estimatedTime: '20 minutes',
        examples: [],
        acceptanceCriteria: [],
        aiModel: 'gpt-3.5-turbo',
        processingTime: 1000,
      },
    };

    apiService.ai.generateChallenge.mockResolvedValue(mockChallenge);

    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    // Generate challenge first
    const skillSelect = screen.getByLabelText(/skill/i);
    const topicInput = screen.getByLabelText(/topic/i);

    await userEvent.selectOptions(skillSelect, 'Python');
    await userEvent.type(topicInput, 'Testing');

    const generateButton = screen.getByText('✨ Generate Challenge');
    fireEvent.click(generateButton);

    // Wait for result to appear
    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByText('💾 Save Challenge');
    fireEvent.click(saveButton);

    expect(mockOnChallengeCreated).toHaveBeenCalledWith(mockChallenge.data);
  });

  it('should display all challenge details after generation', async () => {
    const mockChallenge = {
      data: {
        title: 'Complete Challenge',
        description: 'A comprehensive test challenge',
        difficulty: 'hard',
        category: 'C++',
        estimatedTime: '60 minutes',
        examples: [
          { input: 'input1', output: 'output1' },
          { input: 'input2', output: 'output2' },
        ],
        acceptanceCriteria: ['Criterion 1', 'Criterion 2', 'Criterion 3'],
        aiModel: 'gpt-3.5-turbo',
        processingTime: 2000,
      },
    };

    apiService.ai.generateChallenge.mockResolvedValue(mockChallenge);

    render(
      <AIChallengeModal
        isOpen={true}
        onClose={mockOnClose}
        onChallengeCreated={mockOnChallengeCreated}
      />
    );

    const skillSelect = screen.getByLabelText(/skill/i);
    const topicInput = screen.getByLabelText(/topic/i);

    await userEvent.selectOptions(skillSelect, 'C++');
    await userEvent.type(topicInput, 'Advanced Topics');

    const generateButton = screen.getByText('✨ Generate Challenge');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Complete Challenge')).toBeInTheDocument();
      expect(
        screen.getByText('A comprehensive test challenge')
      ).toBeInTheDocument();
      expect(screen.getByText('hard')).toBeInTheDocument();
      expect(screen.getByText('C++')).toBeInTheDocument();
      expect(screen.getByText('60 minutes')).toBeInTheDocument();
      expect(screen.getByText('Criterion 1')).toBeInTheDocument();
      expect(screen.getByText('Criterion 2')).toBeInTheDocument();
      expect(screen.getByText('Criterion 3')).toBeInTheDocument();
    });
  });
});
