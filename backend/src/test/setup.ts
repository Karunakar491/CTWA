import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { logger } from '@/utils/logger';

// Suppress console logs during testing
beforeAll(() => {
  logger.silent = true;
});

afterAll(() => {
  logger.silent = false;
});

// Clean up before each test
beforeEach(() => {
  // Reset any global state
});

// Clean up after each test
afterEach(() => {
  // Clean up any test data
});