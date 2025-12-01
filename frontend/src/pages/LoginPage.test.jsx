import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../contexts/AuthContext', () => {
  const actual = jest.requireActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: jest.fn(),
  };
});

describe('LoginPage', () => {
  test('submits login and shows error on failure', async () => {
    useAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({ success: false, error: 'Login failed' }),
      isLoading: false,
      error: 'Login failed',
      clearError: jest.fn(),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    const submit = screen.getByTestId('login-button');

    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: 'wrongpass' } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
