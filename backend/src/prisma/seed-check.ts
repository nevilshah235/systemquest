/**
 * seed-check.ts — Audit all mission seed data for completeness.
 *
 * Reports which missions have HLD data, reference solutions,
 * LLD content, and LLD interactive builder configs.
 *
 * Usage: DATABASE_URL=... npx ts-node src/prisma/seed-check.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

function flag(v: unknown): string {
  return v ? PASS : FAIL;
}

async function main() {
  const missions = await prisma.mission.findMany({
    orderBy: { order: 'asc' },
    select: {
      slug: true,
      title: true,
      order: true,
      learningPath: true,
      components: true,
      requirements: true,
      feedbackData: true,
      referenceSolution: true,
      lldEnabled: true,
      lldContent: true,
      lldConfig: true,
    },
  });

  const achievements = await prisma.achievement.count();
  const users = await prisma.user.count();
  const attempts = await prisma.missionAttempt.count();
  const lldAttempts = await prisma.lLDAttempt.count();
  const mistakes = await prisma.mistakePattern.count();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SystemQuest — Seed Data Audit');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`  Missions:      ${missions.length}`);
  console.log(`  Achievements:  ${achievements}`);
  console.log(`  Users:         ${users}`);
  console.log(`  HLD Attempts:  ${attempts}`);
  console.log(`  LLD Attempts:  ${lldAttempts}`);
  console.log(`  Mistakes:      ${mistakes}`);
  console.log();

  // Per-mission audit
  const header = [
    'Ord',
    'Slug'.padEnd(30),
    'Path'.padEnd(16),
    'HLD',
    'Ref',
    'LLD',
    'Cfg',
  ].join(' │ ');

  console.log('─'.repeat(header.length + 4));
  console.log(`  ${header}`);
  console.log('─'.repeat(header.length + 4));

  let hldOk = 0, refOk = 0, lldOk = 0, cfgOk = 0;
  let lldCustom = 0, lldGeneric = 0;

  for (const m of missions) {
    const hasHld = !!(m.components && m.requirements && m.feedbackData);
    const hasRef = !!m.referenceSolution;
    const hasLld = m.lldEnabled && !!m.lldContent;

    let lldQuality = '';
    if (hasLld) {
      try {
        const content = JSON.parse(m.lldContent!);
        const isGeneric = content.prompt?.startsWith('Design the core classes');
        lldQuality = isGeneric ? WARN : PASS;
        if (isGeneric) lldGeneric++; else lldCustom++;
      } catch { lldQuality = FAIL; }
    }

    const hasCfg = !!m.lldConfig;

    if (hasHld) hldOk++;
    if (hasRef) refOk++;
    if (hasLld) lldOk++;
    if (hasCfg) cfgOk++;

    console.log(
      `  ${String(m.order).padStart(3)} │ ` +
      `${m.slug.padEnd(30)} │ ` +
      `${m.learningPath.padEnd(16)} │ ` +
      `${flag(hasHld)}  │ ` +
      `${flag(hasRef)}  │ ` +
      `${hasLld ? lldQuality : FAIL}  │ ` +
      `${flag(hasCfg)}`
    );
  }

  console.log('─'.repeat(header.length + 4));
  console.log();

  console.log('  Legend:');
  console.log(`    HLD = Mission data (components, requirements, feedback)`);
  console.log(`    Ref = Reference solution (for Compare panel)`);
  console.log(`    LLD = LLD content (${PASS} custom / ${WARN} generic / ${FAIL} missing)`);
  console.log(`    Cfg = LLD interactive builder config`);
  console.log();

  console.log('  Summary:');
  console.log(`    HLD data:        ${hldOk}/${missions.length}`);
  console.log(`    Reference soln:  ${refOk}/${missions.length} ${refOk === 0 ? '← needs seed-reference-solutions.ts' : ''}`);
  console.log(`    LLD content:     ${lldOk}/${missions.length} (${lldCustom} custom, ${lldGeneric} generic)`);
  console.log(`    LLD config:      ${cfgOk}/${missions.length} ${cfgOk < missions.length ? '← expand seed-lld-config.ts' : ''}`);
  console.log();
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
