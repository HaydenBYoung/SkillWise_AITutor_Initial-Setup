import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as apiModule from '../services/api';

describe('AuthContext', () => {
  beforeEach(() => {
    jest.spyOn(apiModule, 'clearTokens').mockImplementation(() => {});
    jest.spyOn(apiModule, 'setAccessToken').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('login sets user and isAuthenticated', async () => {
    jest.spyOn(apiModule.apiService.auth, 'login').mockResolvedValue({
      user: { id: 1, email: 'test@example.com' },
      accessToken: 'abc',
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const res = await result.current.login({ email: 'test@example.com', password: 'x' });
      expect(res.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 1, email: 'test@example.com' });
  });

  test('logout clears tokens and resets state', async () => {
    jest.spyOn(apiModule.apiService.auth, 'logout').mockResolvedValue({ ok: true });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Pre-set some state via login
    act(() => {
      result.current.clearError();
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(apiModule.clearTokens).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });
});
