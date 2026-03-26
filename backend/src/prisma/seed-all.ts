/**
 * seed-all.ts — Run all seed scripts in the correct order.
 *
 * Usage: DATABASE_URL=... npx ts-node src/prisma/seed-all.ts
 *
 * For the demo account, set DEMO_SEED_EMAIL and DEMO_SEED_PASSWORD
 * in .env.local or as environment variables.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const seeds = [
  { name: 'Base (achievements + missions)',       file: 'seed.ts' },
  { name: 'Sprint 2 missions',                    file: 'seed-sprint2.ts' },
  { name: 'Sprint 3 missions (26-40)',            file: 'seed-sprint3.ts' },
  { name: 'Sprint 3 Concept Depth (41-48)',       file: 'seed-concepts.ts' },
  { name: 'HLD reference solutions (Compare)',    file: 'seed-reference-solutions.ts' },
  { name: 'LLD phase content',                    file: 'seed-lld.ts' },
  { name: 'LLD interactive builder config',       file: 'seed-lld-config.ts' },
  { name: 'Demo user account',                    file: 'seed-demo.ts' },
];

const dir = path.resolve(__dirname);

for (const s of seeds) {
  const filePath = path.join(dir, s.file);
  console.log(`\n━━━ ${s.name} (${s.file}) ━━━`);
  try {
    execSync(`npx ts-node "${filePath}"`, { stdio: 'inherit', cwd: path.resolve(dir, '../..'), env: { ...process.env } });
    console.log(`  ✅ Done`);
  } catch (err) {
    console.error(`  ❌ Failed: ${s.file}`);
    process.exit(1);
  }
}

console.log('\n🎉 All seeds complete.');
