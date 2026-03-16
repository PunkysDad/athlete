jest.mock('expo/src/winter', () => {});
jest.mock('expo/virtual/streams', () => {});

// Suppress service console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
