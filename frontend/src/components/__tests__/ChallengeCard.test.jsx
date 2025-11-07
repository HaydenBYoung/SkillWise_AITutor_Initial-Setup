import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChallengeCard from '../challenges/ChallengeCard';

// Mock challenge data
const mockChallenge = {
  id: 1,
  title: 'Test Challenge',
  description: 'A test challenge for unit testing',
  category: 'programming',
  difficulty_level: 'beginner',
  points_reward: 50,
  status: 'available',
  submissions: [],
};

const mockChallengeWithSubmission = {
  ...mockChallenge,
  status: 'completed',
  submissions: [
    {
      id: 1,
      status: 'passed',
      score: 85,
      submitted_at: new Date().toISOString(),
    },
  ],
};

describe('ChallengeCard', () => {
  test('renders challenge title and description', () => {
    render(<ChallengeCard challenge={mockChallenge} />);

    expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    expect(
      screen.getByText('A test challenge for unit testing')
    ).toBeInTheDocument();
  });

  test('displays "Available" status for challenges with no submissions', () => {
    render(<ChallengeCard challenge={mockChallenge} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Start Challenge')).toBeInTheDocument();
  });

  test('displays "Completed" status for challenges with passing submissions', () => {
    render(<ChallengeCard challenge={mockChallengeWithSubmission} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  test('displays correct difficulty and category', () => {
    render(<ChallengeCard challenge={mockChallenge} />);

    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('programming')).toBeInTheDocument();
  });

  test('displays points reward', () => {
    render(<ChallengeCard challenge={mockChallenge} />);

    expect(screen.getByText('50 pts')).toBeInTheDocument();
  });

  test('calls onSelect when Start Challenge button is clicked', () => {
    const mockOnSelect = jest.fn();
    render(<ChallengeCard challenge={mockChallenge} onSelect={mockOnSelect} />);

    const startButton = screen.getByText('Start Challenge');
    fireEvent.click(startButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockChallenge);
  });
});
