import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // Inject env vars before any module is imported — these override .env
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'ci-test-jwt-secret-key-32chars!!',
      JWT_REFRESH_SECRET: 'ci-test-refresh-secret-32chars!!',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      PORT: '0', // disable server binding in tests
    },

    // Run once before the full test suite to sync DB schema
    globalSetup: './src/__tests__/globalSetup.ts',

    include: ['src/__tests__/**/*.test.ts'],

    // Run all integration tests in a single worker to avoid SQLite locking
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../coverage/backend',
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/index.ts',
        'src/prisma/**',
        'src/lib/**',
      ],
    },
  },
});
