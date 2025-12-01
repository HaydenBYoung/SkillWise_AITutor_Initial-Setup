// CommonJS mock for axios to avoid ESM import issues in Jest
const mockInstance = {
  interceptors: {
    request: { use: jest.fn((fn) => fn) },
    response: { use: jest.fn((onFulfilled, onRejected) => ({ onFulfilled, onRejected })) },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: {} },
};

const axios = {
  create: jest.fn(() => ({ ...mockInstance })),
  // direct calls (used for refresh endpoint)
  post: jest.fn(),
};

module.exports = axios;
