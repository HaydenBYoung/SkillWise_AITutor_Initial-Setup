import '@testing-library/jest-dom/extend-expect';
// Mock axios (ESM entry) so Jest doesn't try to parse the ESM module in node_modules
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: {} },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as api from '../../services/api';
import GoalForm from './GoalForm';

describe('GoalForm', () => {
  beforeEach(() => {
    // ensure the apiService mock exists and reset it
    api.apiService = api.apiService || { goals: { create: jest.fn() } };
    api.apiService.goals.create = jest.fn(() => Promise.resolve({ data: { goal: { id: 123, title: 'Test Goal' } } }));
  });

  it('renders and submits a new goal', async () => {
    const onCreate = jest.fn();
    render(<GoalForm onCreate={onCreate} />);

    const titleInput = screen.getByPlaceholderText(/Ex: Learn React Hooks/i);
    const descInput = screen.getByPlaceholderText(/Describe your goal.../i);
    const submitBtn = screen.getByRole('button', { name: /Create Goal/i });

    fireEvent.change(titleInput, { target: { value: 'New Goal' } });
    fireEvent.change(descInput, { target: { value: 'Goal description' } });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ id: 123, title: 'Test Goal' }));
  });
});
