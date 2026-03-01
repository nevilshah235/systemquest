/**
 * seed-lld-config.ts — Seeds lldConfig (interactive builder config) for LLD-enabled missions.
 *
 * Run after: npx prisma migrate dev --name lld_interactive_builder
 * Command:   npx ts-node src/prisma/seed-lld-config.ts
 *
 * This populates missions.lldConfig with the LLDMissionConfig JSON that
 * drives the new interactive LLD builder UI (FEAT-LLD-001).
 *
 * Missions without an entry here continue to use the legacy textarea LLD form.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── LLDMissionConfig type (mirrors frontend lldTypes.ts) ──────────────────────

interface LLDMissionConfig {
  allowedDecisions: ArchDecisionCategory[];
  seedEntities: SeedEntity[];
  forcedDbType?: 'sql' | 'nosql';
  defaultApiStyle?: string;
  scoringWeights: { archDecisions: number; schema: number; apiContracts: number };
  penaltyRules: PenaltyRule[];
  penaltyCap: number;
}

interface ArchDecisionCategory {
  id: string;
  label: string;
  options: { id: string; label: string; description: string; icon?: string }[];
  correctOption?: string;
}

interface SeedEntity {
  name: string;
  fields: { name: string; type: string; isPrimaryKey?: boolean; isRequired?: boolean }[];
  locked?: boolean;
}

interface PenaltyRule {
  trigger: string;
  xpDeduction: number;
  message: string;
}

// ── Common decision categories (reused across missions) ───────────────────────

const AUTH_DECISIONS: ArchDecisionCategory = {
  id: 'auth',
  label: 'Authentication',
  options: [
    { id: 'jwt', label: 'JWT', description: 'Stateless token-based auth — ideal for microservices' },
    { id: 'oauth', label: 'OAuth 2.0', description: 'Third-party delegation — for social login' },
    { id: 'session', label: 'Session', description: 'Server-side sessions — simpler, stateful' },
  ],
};

const CACHING_DECISIONS: ArchDecisionCategory = {
  id: 'caching',
  label: 'Caching Strategy',
  options: [
    { id: 'cache_aside', label: 'Cache-Aside', description: 'App loads cache on miss — most flexible' },
    { id: 'write_through', label: 'Write-Through', description: 'Sync write to cache + DB — strong consistency' },
    { id: 'write_behind', label: 'Write-Behind', description: 'Async DB write — higher throughput, eventual' },
  ],
  correctOption: 'cache_aside',
};

const LB_DECISIONS: ArchDecisionCategory = {
  id: 'load_balancing',
  label: 'Load Balancing',
  options: [
    { id: 'round_robin', label: 'Round Robin', description: 'Even distribution — simplest approach' },
    { id: 'least_conn', label: 'Least Connections', description: 'Routes to least busy server' },
    { id: 'ip_hash', label: 'IP Hash', description: 'Session affinity — same client = same server' },
  ],
};

const DB_TYPE_DECISIONS: ArchDecisionCategory = {
  id: 'db_type',
  label: 'Database Type',
  options: [
    { id: 'sql', label: 'SQL', description: 'Relational, ACID, strong schema' },
    { id: 'nosql', label: 'NoSQL', description: 'Flexible schema, horizontal scale' },
  ],
};

const API_STYLE_DECISIONS: ArchDecisionCategory = {
  id: 'api_style',
  label: 'API Style',
  options: [
    { id: 'rest', label: 'REST', description: 'Resource-oriented, stateless, widely adopted' },
    { id: 'graphql', label: 'GraphQL', description: 'Client-driven queries, single endpoint' },
    { id: 'grpc', label: 'gRPC', description: 'Binary protocol, ideal for internal services' },
  ],
};

const QUEUE_DECISIONS: ArchDecisionCategory = {
  id: 'message_queue',
  label: 'Message Queue',
  options: [
    { id: 'none', label: 'None', description: 'No queue — synchronous processing' },
    { id: 'rabbitmq', label: 'RabbitMQ', description: 'Reliable task queue, pub/sub support' },
    { id: 'kafka', label: 'Kafka', description: 'High-throughput event streaming' },
  ],
};

const STANDARD_PENALTIES: PenaltyRule[] = [
  {
    trigger: 'db_type_switched_mid_design',
    xpDeduction: 3,
    message: 'Changing your mind has a cost in real systems too 💡 -3 XP',
  },
  {
    trigger: 'submitted_with_unresolved_warnings',
    xpDeduction: 5,
    message: '⚠️ You submitted with unresolved warnings. Fix them first! -5 XP',
  },
];

// ── Mission LLD Configs ───────────────────────────────────────────────────────

const LLD_CONFIGS: Record<string, LLDMissionConfig> = {
  // F-01: MVP Launch
  'mvp-launch': {
    allowedDecisions: [AUTH_DECISIONS, DB_TYPE_DECISIONS, API_STYLE_DECISIONS],
    seedEntities: [
      {
        name: 'User',
        locked: true,
        fields: [
          { name: 'id', type: 'uuid', isPrimaryKey: true },
          { name: 'email', type: 'string', isRequired: true },
          { name: 'username', type: 'string', isRequired: true },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      { name: 'Post', locked: false, fields: [] },
      { name: 'Session', locked: false, fields: [] },
    ],
    defaultApiStyle: 'rest',
    scoringWeights: { archDecisions: 40, schema: 25, apiContracts: 35 },
    penaltyRules: [
      ...STANDARD_PENALTIES,
    ],
    penaltyCap: 20,
  },

  // F-02: Scaling Up — the reference mission from design spec
  'scaling-up': {
    allowedDecisions: [AUTH_DECISIONS, CACHING_DECISIONS, LB_DECISIONS, DB_TYPE_DECISIONS, API_STYLE_DECISIONS],
    seedEntities: [
      {
        name: 'User',
        locked: true,
        fields: [
          { name: 'id', type: 'uuid', isPrimaryKey: true },
          { name: 'email', type: 'string', isRequired: true },
          { name: 'username', type: 'string', isRequired: true },
          { name: 'createdAt', type: 'timestamp' },
        ],
      },
      { name: 'Post', locked: false, fields: [] },
      { name: 'CacheEntry', locked: false, fields: [] },
      { name: 'Session', locked: false, fields: [] },
    ],
    defaultApiStyle: 'rest',
    scoringWeights: { archDecisions: 40, schema: 25, apiContracts: 35 },
    penaltyRules: [
      {
        trigger: 'no_caching_selected',
        xpDeduction: 10,
        message: '⚠️ No caching for 10k users? This will bottleneck! -10 XP',
      },
      {
        trigger: 'over_engineered_queue',
        xpDeduction: 5,
        message: '💡 Kafka for this scale? Over-engineered! -5 XP',
      },
      ...STANDARD_PENALTIES,
    ],
    penaltyCap: 20,
  },

  // F-03: Global Expansion
  'global-expansion': {
    allowedDecisions: [
      AUTH_DECISIONS,
      CACHING_DECISIONS,
      {
        id: 'cdn',
        label: 'CDN Strategy',
        options: [
          { id: 'cloudflare', label: 'Cloudflare', description: 'Global edge network, DDoS protection' },
          { id: 'cloudfront', label: 'AWS CloudFront', description: 'AWS-native CDN with S3 integration' },
          { id: 'none', label: 'None', description: 'No CDN — direct origin serving' },
        ],
        correctOption: 'cloudflare',
      },
      DB_TYPE_DECISIONS,
      {
        id: 'data_replication',
        label: 'Data Replication',
        options: [
          { id: 'master_slave', label: 'Primary-Replica', description: 'Reads scale, writes to primary only' },
          { id: 'multi_master', label: 'Multi-Primary', description: 'Writes anywhere, conflict resolution needed' },
          { id: 'none', label: 'Single Region', description: 'No replication — single region only' },
        ],
        correctOption: 'master_slave',
      },
    ],
    seedEntities: [
      {
        name: 'User',
        locked: true,
        fields: [
          { name: 'id', type: 'uuid', isPrimaryKey: true },
          { name: 'email', type: 'string', isRequired: true },
          { name: 'region', type: 'string', isRequired: true },
        ],
      },
      { name: 'Content', locked: false, fields: [] },
      { name: 'Region', locked: false, fields: [] },
      { name: 'ReplicationLog', locked: false, fields: [] },
    ],
    defaultApiStyle: 'rest',
    scoringWeights: { archDecisions: 45, schema: 25, apiContracts: 30 },
    penaltyRules: [
      {
        trigger: 'no_caching_selected',
        xpDeduction: 10,
        message: '⚠️ No CDN or caching for global traffic? This will be slow! -10 XP',
      },
      ...STANDARD_PENALTIES,
    ],
    penaltyCap: 20,
  },

  // Queue-based mission
  'file-converter': {
    allowedDecisions: [
      DB_TYPE_DECISIONS,
      QUEUE_DECISIONS,
      {
        id: 'storage',
        label: 'File Storage',
        options: [
          { id: 's3', label: 'S3 / Object Store', description: 'Scalable blob storage, CDN-friendly' },
          { id: 'filesystem', label: 'Filesystem', description: 'Simple but not scalable' },
          { id: 'db', label: 'In-Database', description: 'BLOB storage in DB — avoid for large files' },
        ],
        correctOption: 's3',
      },
    ],
    seedEntities: [
      { name: 'Job', locked: false, fields: [] },
      { name: 'File', locked: false, fields: [] },
      { name: 'Worker', locked: false, fields: [] },
    ],
    defaultApiStyle: 'rest',
    scoringWeights: { archDecisions: 40, schema: 30, apiContracts: 30 },
    penaltyRules: STANDARD_PENALTIES,
    penaltyCap: 20,
  },
};

// ── Seed function ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding lldConfig for LLD-enabled missions...\n');

  for (const [slug, config] of Object.entries(LLD_CONFIGS)) {
    const mission = await prisma.mission.findUnique({ where: { slug } });
    if (!mission) {
      console.log(`  ⚠️  Mission not found: ${slug} — skipping`);
      continue;
    }

    await prisma.mission.update({
      where: { slug },
      data: { lldConfig: JSON.stringify(config) },
    });

    console.log(`  ✅ ${slug} — lldConfig seeded (${config.allowedDecisions.length} decisions, ${config.seedEntities.length} entities)`);
  }

  console.log('\n✅ lldConfig seed complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
