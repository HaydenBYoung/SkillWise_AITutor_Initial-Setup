import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ChallengeCard from './ChallengeCard';

describe('ChallengeCard', () => {
  it('shows optimistic completion and calls onToggleComplete', async () => {
    const mockChallenge = { id: 1, title: 'Test', description: 'desc', progress: 0, completed: false };
    const onToggle = jest.fn(() => Promise.resolve());

    render(<ChallengeCard challenge={mockChallenge} onToggleComplete={onToggle} />);

    const markBtn = screen.getByRole('button', { name: /Mark Complete/i });
    await act(async () => {
      fireEvent.click(markBtn);
    });

    expect(onToggle).toHaveBeenCalledWith(1, expect.objectContaining({ completed: true }));
    // optimistic UI: 'Completed' label should appear
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });

  it('shows Undo when pending and calls onUndo', async () => {
    const mockChallenge = { id: 2, title: 'Test 2', description: 'desc', progress: 0, completed: false };
    const onUndo = jest.fn();

    render(<ChallengeCard challenge={mockChallenge} pending={true} onUndo={onUndo} />);

    const undoBtn = screen.getByRole('button', { name: /Undo/i });
    expect(undoBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(undoBtn);
    });
    expect(onUndo).toHaveBeenCalledWith(2);
  });
});
