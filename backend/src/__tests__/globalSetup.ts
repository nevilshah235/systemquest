/**
 * globalSetup.ts — Runs once before any test suite.
 * Syncs the test SQLite database schema via prisma db push.
 */
import { execSync } from 'child_process';
import path from 'path';

const TEST_DB_URL = 'file:./prisma/test.db';

export async function setup(): Promise<void> {
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: TEST_DB_URL,
      },
      cwd: path.resolve(__dirname, '../../..'), // backend root
      stdio: 'pipe',
    });
  } catch (err) {
    console.error('⚠ prisma db push failed during test setup', err);
    throw err;
  }
}

export async function teardown(): Promise<void> {
  // The test.db file is listed in .gitignore and is ephemeral — no cleanup needed
}
