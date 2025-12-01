import api, { apiService, setAccessToken, getAccessToken, clearTokens } from './api';

jest.mock('axios');

describe('api service', () => {
  beforeEach(() => {
    clearTokens();
    jest.resetAllMocks();
  });

  test('token utilities set/get/clear work', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('abc');
    expect(getAccessToken()).toBe('abc');
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });

  test('login calls api.post and returns payload', async () => {
    const postMock = jest.spyOn(api, 'post').mockResolvedValueOnce({ data: { ok: true } });
    const res = await apiService.auth.login({ email: 'a@b.com', password: 'x' });
    expect(res).toEqual({ ok: true });
    expect(postMock).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'x' });
    postMock.mockRestore();
  });

  test('progress.getOverview unwraps response.data.data fallback', async () => {
    const getMock = jest.spyOn(api, 'get').mockResolvedValueOnce({ data: { data: { points: 10 } } });
    const res = await apiService.progress.getOverview();
    expect(res).toEqual({ points: 10 });
    expect(getMock).toHaveBeenCalledWith('/progress', { params: {} });
    getMock.mockRestore();
  });
});
