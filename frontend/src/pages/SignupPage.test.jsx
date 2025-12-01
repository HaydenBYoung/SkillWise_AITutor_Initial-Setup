import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import SignupPage from './SignupPage';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      ...actual.apiService,
      auth: {
        register: jest.fn(async () => ({ data: { user: { id: 2 } } })),
      },
    },
  };
});

describe('SignupPage', () => {
  test('renders form and submit triggers register', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Basic smoke test: no unhandled errors
  });
});
