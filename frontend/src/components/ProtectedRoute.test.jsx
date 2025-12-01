import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

function Dummy() { return <div>Private Content</div>; }
function Public() { return <div>Login Page</div>; }

jest.mock('../contexts/AuthContext', () => {
  const actual = jest.requireActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: null }),
  };
});

describe('ProtectedRoute', () => {
  test('redirects to login when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Public />} />
            <Route path="/private" element={<ProtectedRoute><Dummy /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockReturnValue({ user: { id: 1 } });
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AuthProvider>
          <Routes>
            <Route path="/private" element={<ProtectedRoute><Dummy /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/private content/i)).toBeInTheDocument();
  });
});
