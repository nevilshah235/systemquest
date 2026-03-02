/**
 * seed-demo.ts — SystemQuest Demo Video Data Seed
 *
 * Creates a ready-to-demo user state for the SystemQuest demo video.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Credentials are loaded from environment variables — never hardcoded.
 *  Copy backend/.env.demo.example → backend/.env.local and fill in values.
 *
 *    DEMO_SEED_EMAIL=...      (e.g. demo@your-domain.com)
 *    DEMO_SEED_PASSWORD=...   (strong password, ≥12 chars)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  State seeded:
 *
 *  ✅ COMPLETED (17 HLD missions — all paths fully unlocked for demo)
 *     Foundations (8 ALL):   MVP Launch · Scaling Up · Global Expansion
 *                            ChatGPT Backend · Secure the Gates · The File Converter
 *                            Notification Engine · REST vs GraphQL
 *                              → ALL 8 foundations done → foundationsComplete=true → ALL paths unlocked
 *     Async Queues:          File Converter · Code Judge
 *     High-Read:             URL Shortener (score 91) · Search Engine
 *     Real-Time:             Live Scoreboard · Ride Hailing → unlocks Design WhatsApp
 *     Scale & Streaming:     Social Feed · Video Streaming
 *     Consistency:           Booking System → unlocks Payment Processing
 *
 *  🏗️  LLD ATTEMPTS (4 rich pre-filled designs — all scoring 88–93)
 *     MVP Launch         — User/Post/Session with full fields, indexes, REST endpoints
 *     Scaling Up         — User/Post/CacheEntry/Session with cache-aside, load-balancing
 *     Global Expansion   — User/Content/Region/ReplicationLog with CDN + master-slave
 *     File Converter     — Job/File/Worker with Kafka queue, S3 storage, presigned URLs
 *
 *  🎨 PREFILLED IN-PROGRESS (showcased on the drag-and-drop canvas)
 *     Design WhatsApp    — WebSocket + Queue + Cassandra architecture
 *     Payment Processing — Stripe-style idempotency + ACID design
 *
 *  🔒 LOCKED (server-side sequential lock — prerequisites not met)
 *     Design Slack             — locked until WhatsApp is completed
 *     How Stock Exchange Works — new capstone mission (600 XP, order 50)
 *
 *  ⚠️  MISTAKE PATTERNS (4 active — populates Mistakes Tracker panel)
 *     Missing Rate Limiter · Single DB SPOF
 *     Synchronous Payment Call · No Dead Letter Queue
 *
 * Usage:
 *   cp backend/.env.demo.example backend/.env.local
 *   # edit .env.local with real credentials
 *   npm run prisma:seed        # run base seed first (all sprints)
 *   npm run prisma:seed-demo   # then this
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Load .env.local first (demo-specific overrides), then fall back to .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Validate required env vars before doing anything
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    throw new Error(
      `[seed-demo] Missing required environment variable: ${key}\n` +
      `  Copy backend/.env.demo.example → backend/.env.local and set a value.`,
    );
  }
  return val.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// HLD Architecture JSON payloads
// ─────────────────────────────────────────────────────────────────────────────

const urlShortenerArch = {
  components: [
    { id: 'u1', type: 'client',       x: 80,   y: 300 },
    { id: 'u2', type: 'apigateway',   x: 280,  y: 300 },
    { id: 'u3', type: 'loadbalancer', x: 480,  y: 300 },
    { id: 'u4', type: 'server',       x: 680,  y: 180 },
    { id: 'u5', type: 'server',       x: 680,  y: 420 },
    { id: 'u6', type: 'cache',        x: 900,  y: 180 },
    { id: 'u7', type: 'database',     x: 900,  y: 420 },
    { id: 'u8', type: 'monitoring',   x: 680,  y: 600 },
  ],
  connections: [
    { from: 'u1', to: 'u2' }, { from: 'u2', to: 'u3' },
    { from: 'u3', to: 'u4' }, { from: 'u3', to: 'u5' },
    { from: 'u4', to: 'u6' }, { from: 'u5', to: 'u6' },
    { from: 'u6', to: 'u7' }, { from: 'u4', to: 'u8' }, { from: 'u5', to: 'u8' },
  ],
};

const whatsappArch = {
  components: [
    { id: 'w1', type: 'client',       x: 80,   y: 360 },
    { id: 'w2', type: 'apigateway',   x: 280,  y: 360 },
    { id: 'w3', type: 'loadbalancer', x: 480,  y: 360 },
    { id: 'w4', type: 'server',       x: 700,  y: 200 },
    { id: 'w5', type: 'server',       x: 700,  y: 520 },
    { id: 'w6', type: 'queue',        x: 920,  y: 360 },
    { id: 'w7', type: 'cache',        x: 1140, y: 200 },
    { id: 'w8', type: 'database',     x: 1140, y: 520 },
    { id: 'w9', type: 'storage',      x: 1360, y: 360 },
  ],
  connections: [
    { from: 'w1', to: 'w2' }, { from: 'w2', to: 'w3' },
    { from: 'w3', to: 'w4' }, { from: 'w3', to: 'w5' },
    { from: 'w4', to: 'w6' }, { from: 'w5', to: 'w6' },
    { from: 'w6', to: 'w8' }, { from: 'w4', to: 'w7' },
    { from: 'w5', to: 'w7' }, { from: 'w4', to: 'w9' },
  ],
};

const paymentArch = {
  components: [
    { id: 'p1', type: 'client',       x: 80,   y: 360 },
    { id: 'p2', type: 'apigateway',   x: 280,  y: 360 },
    { id: 'p3', type: 'loadbalancer', x: 480,  y: 360 },
    { id: 'p4', type: 'server',       x: 700,  y: 200 },
    { id: 'p5', type: 'server',       x: 700,  y: 520 },
    { id: 'p6', type: 'cache',        x: 920,  y: 200 },
    { id: 'p7', type: 'database',     x: 920,  y: 520 },
    { id: 'p8', type: 'monitoring',   x: 1140, y: 360 },
  ],
  connections: [
    { from: 'p1', to: 'p2' }, { from: 'p2', to: 'p3' },
    { from: 'p3', to: 'p4' }, { from: 'p3', to: 'p5' },
    { from: 'p4', to: 'p6' }, { from: 'p4', to: 'p7' },
    { from: 'p5', to: 'p7' }, { from: 'p4', to: 'p8' }, { from: 'p5', to: 'p8' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LLD Builder State payloads — rich pre-filled designs for showcase
// Each scored 88–93 to demonstrate a near-perfect production-quality LLD.
// ─────────────────────────────────────────────────────────────────────────────

/** Shared feedback that appears for all high-scoring LLD submissions */
const lldGoodFeedback = [
  { type: 'success', dimension: 'archDecisions', message: '✅ Correct architecture decisions — well reasoned choices.' },
  { type: 'success', dimension: 'schema',        message: '✅ All entities have primary keys defined.' },
  { type: 'success', dimension: 'schema',        message: '✅ Entity relationships defined.' },
  { type: 'success', dimension: 'schema',        message: '🎯 Smart indexing! Indexes speed up read queries.' },
  { type: 'success', dimension: 'apiContracts',  message: '✅ Error responses (4xx/5xx) defined — important for production APIs.' },
  { type: 'success', dimension: 'apiContracts',  message: '✅ Authorization headers included — matches your auth architecture decision.' },
  { type: 'success', dimension: 'apiContracts',  message: '🎯 Cursor pagination — scales better than offset!' },
  { type: 'success', dimension: 'overall',       message: '🎉 LLD complete! Your design is production-quality.' },
];

/** MVP Launch — User/Post/Session blog platform */
const mvpLldState = {
  archDecisions: { auth: 'jwt', db_type: 'sql', api_style: 'rest' },
  dbType: 'sql', dbTypeSwitched: false, apiStyle: 'rest', submittedWithWarnings: false,
  entities: [
    { id: 'e-user', name: 'User', isSeeded: true, position: { x: 80, y: 80 }, fields: [
      { name: 'id',           type: 'uuid',      isPrimaryKey: true },
      { name: 'email',        type: 'string',    isRequired: true,  hasIndex: true },
      { name: 'username',     type: 'string',    isRequired: true },
      { name: 'passwordHash', type: 'string',    isRequired: true },
      { name: 'role',         type: 'enum',      enumValues: ['user','admin'] },
      { name: 'createdAt',    type: 'timestamp' },
    ]},
    { id: 'e-post', name: 'Post', isSeeded: true, position: { x: 440, y: 80 }, fields: [
      { name: 'id',        type: 'uuid',      isPrimaryKey: true },
      { name: 'title',     type: 'string',    isRequired: true },
      { name: 'content',   type: 'text',      isRequired: true },
      { name: 'authorId',  type: 'uuid',      references: 'User', hasIndex: true },
      { name: 'status',    type: 'enum',      enumValues: ['draft','published'], hasIndex: true },
      { name: 'createdAt', type: 'timestamp', hasIndex: true },
    ]},
    { id: 'e-session', name: 'Session', isSeeded: true, position: { x: 80, y: 360 }, fields: [
      { name: 'id',        type: 'uuid',      isPrimaryKey: true },
      { name: 'userId',    type: 'uuid',      references: 'User', hasIndex: true },
      { name: 'token',     type: 'string',    isRequired: true,   hasIndex: true },
      { name: 'expiresAt', type: 'timestamp', isRequired: true },
      { name: 'createdAt', type: 'timestamp' },
    ]},
  ],
  relationships: [
    { fromEntity: 'User', toEntity: 'Post',    type: 'one-to-many', label: 'authors' },
    { fromEntity: 'User', toEntity: 'Session', type: 'one-to-many', label: 'has sessions' },
  ],
  restEndpoints: [
    { method: 'POST', path: '/auth/register',
      requestBody: { email:'string', username:'string', password:'string' },
      responseShape: { id:'uuid', email:'string', token:'string' },
      statusCodes: [201,400,409], headers: {}, paginationType: 'none' },
    { method: 'POST', path: '/auth/login',
      requestBody: { email:'string', password:'string' },
      responseShape: { token:'string', user:{ id:'uuid', email:'string' } },
      statusCodes: [200,401], headers: {}, paginationType: 'none' },
    { method: 'GET',  path: '/posts',
      responseShape: { data:[{ id:'uuid', title:'string', status:'string' }], nextCursor:'string' },
      statusCodes: [200,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'cursor' },
    { method: 'POST', path: '/posts',
      requestBody: { title:'string', content:'string' },
      responseShape: { id:'uuid', title:'string', status:'string' },
      statusCodes: [201,400,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
    { method: 'GET',  path: '/posts/:id',
      responseShape: { id:'uuid', title:'string', content:'string', author:{ id:'uuid', username:'string' } },
      statusCodes: [200,404], headers: {}, paginationType: 'none' },
  ],
  graphqlOperations: [],
};

/** Scaling Up — User/Post/CacheEntry/Session with cache-aside + load balancing */
const scalingLldState = {
  archDecisions: { auth: 'jwt', caching: 'cache_aside', load_balancing: 'round_robin', db_type: 'sql', api_style: 'rest' },
  dbType: 'sql', dbTypeSwitched: false, apiStyle: 'rest', submittedWithWarnings: false,
  entities: [
    { id: 'e-user', name: 'User', isSeeded: true, position: { x: 80, y: 80 }, fields: [
      { name: 'id',        type: 'uuid',  isPrimaryKey: true },
      { name: 'email',     type: 'string',isRequired: true,  hasIndex: true },
      { name: 'username',  type: 'string',isRequired: true,  hasIndex: true },
      { name: 'tier',      type: 'enum',  enumValues: ['free','pro','enterprise'] },
      { name: 'createdAt', type: 'timestamp' },
    ]},
    { id: 'e-post', name: 'Post', isSeeded: true, position: { x: 440, y: 80 }, fields: [
      { name: 'id',        type: 'uuid',      isPrimaryKey: true },
      { name: 'title',     type: 'string',    isRequired: true },
      { name: 'content',   type: 'text' },
      { name: 'authorId',  type: 'uuid',      references: 'User', hasIndex: true },
      { name: 'viewCount', type: 'int',       hasIndex: true },
      { name: 'createdAt', type: 'timestamp', hasIndex: true },
    ]},
    { id: 'e-cache', name: 'CacheEntry', isSeeded: true, position: { x: 440, y: 360 }, fields: [
      { name: 'id',         type: 'uuid',  isPrimaryKey: true },
      { name: 'cacheKey',   type: 'string',isRequired: true, hasIndex: true },
      { name: 'value',      type: 'text',  isRequired: true },
      { name: 'ttlSeconds', type: 'int' },
      { name: 'createdAt',  type: 'timestamp' },
    ]},
    { id: 'e-session', name: 'Session', isSeeded: true, position: { x: 80, y: 360 }, fields: [
      { name: 'id',        type: 'uuid',     isPrimaryKey: true },
      { name: 'userId',    type: 'uuid',     references: 'User', hasIndex: true },
      { name: 'token',     type: 'string',   isRequired: true,   hasIndex: true },
      { name: 'expiresAt', type: 'timestamp',isRequired: true },
    ]},
  ],
  relationships: [
    { fromEntity: 'User', toEntity: 'Post',       type: 'one-to-many', label: 'authors' },
    { fromEntity: 'User', toEntity: 'Session',    type: 'one-to-many', label: 'sessions' },
    { fromEntity: 'Post', toEntity: 'CacheEntry', type: 'one-to-one',  label: 'cached by' },
  ],
  restEndpoints: [
    { method: 'GET',    path: '/posts',
      responseShape: { data:[{ id:'uuid', title:'string', viewCount:'int' }], nextCursor:'string' },
      statusCodes: [200,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'cursor' },
    { method: 'POST',   path: '/posts',
      requestBody: { title:'string', content:'string' },
      responseShape: { id:'uuid', title:'string' },
      statusCodes: [201,400,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
    { method: 'GET',    path: '/posts/:id',
      responseShape: { id:'uuid', title:'string', content:'string', viewCount:'int' },
      statusCodes: [200,404], headers: {}, paginationType: 'none' },
    { method: 'DELETE', path: '/posts/:id',
      responseShape: { deleted: true },
      statusCodes: [204,401,403,404], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
  ],
  graphqlOperations: [],
};

/** Global Expansion — User/Content/Region/ReplicationLog with CDN + master-slave */
const globalLldState = {
  archDecisions: { auth: 'jwt', caching: 'cache_aside', cdn: 'cloudflare', db_type: 'sql', data_replication: 'master_slave' },
  dbType: 'sql', dbTypeSwitched: false, apiStyle: 'rest', submittedWithWarnings: false,
  entities: [
    { id: 'e-user', name: 'User', isSeeded: true, position: { x: 80, y: 80 }, fields: [
      { name: 'id',        type: 'uuid',     isPrimaryKey: true },
      { name: 'email',     type: 'string',   isRequired: true, hasIndex: true },
      { name: 'regionId',  type: 'uuid',     references: 'Region', hasIndex: true },
      { name: 'locale',    type: 'string' },
      { name: 'timezone',  type: 'string' },
      { name: 'createdAt', type: 'timestamp' },
    ]},
    { id: 'e-content', name: 'Content', isSeeded: true, position: { x: 440, y: 80 }, fields: [
      { name: 'id',        type: 'uuid',      isPrimaryKey: true },
      { name: 'title',     type: 'string',    isRequired: true },
      { name: 'body',      type: 'text',      isRequired: true },
      { name: 'authorId',  type: 'uuid',      references: 'User',   hasIndex: true },
      { name: 'regionId',  type: 'uuid',      references: 'Region', hasIndex: true },
      { name: 'language',  type: 'string',    hasIndex: true },
      { name: 'cdnUrl',    type: 'string' },
      { name: 'createdAt', type: 'timestamp', hasIndex: true },
    ]},
    { id: 'e-region', name: 'Region', isSeeded: true, position: { x: 80, y: 380 }, fields: [
      { name: 'id',            type: 'uuid',  isPrimaryKey: true },
      { name: 'code',          type: 'string',isRequired: true, hasIndex: true },
      { name: 'name',          type: 'string',isRequired: true },
      { name: 'continent',     type: 'string' },
      { name: 'primaryDbHost', type: 'string' },
      { name: 'replicaDbHost', type: 'string' },
    ]},
    { id: 'e-repllog', name: 'ReplicationLog', isSeeded: true, position: { x: 440, y: 380 }, fields: [
      { name: 'id',           type: 'uuid',      isPrimaryKey: true },
      { name: 'sourceRegion', type: 'string',    hasIndex: true },
      { name: 'targetRegion', type: 'string',    hasIndex: true },
      { name: 'operation',    type: 'enum',      enumValues: ['INSERT','UPDATE','DELETE'] },
      { name: 'tableName',    type: 'string',    hasIndex: true },
      { name: 'recordId',     type: 'string' },
      { name: 'status',       type: 'enum',      enumValues: ['PENDING','APPLIED','FAILED'], hasIndex: true },
      { name: 'createdAt',    type: 'timestamp', hasIndex: true },
    ]},
  ],
  relationships: [
    { fromEntity: 'Region', toEntity: 'User',           type: 'one-to-many', label: 'hosts users' },
    { fromEntity: 'Region', toEntity: 'Content',        type: 'one-to-many', label: 'scoped to' },
    { fromEntity: 'User',   toEntity: 'Content',        type: 'one-to-many', label: 'authors' },
    { fromEntity: 'Region', toEntity: 'ReplicationLog', type: 'one-to-many', label: 'source of' },
  ],
  restEndpoints: [
    { method: 'GET',  path: '/content',
      responseShape: { data:[{ id:'uuid', title:'string', language:'string', region:'string' }], nextCursor:'string' },
      statusCodes: [200,401], headers: { Authorization:'Bearer <token>', 'Accept-Language':'en-US' }, paginationType: 'cursor' },
    { method: 'POST', path: '/content',
      requestBody: { title:'string', body:'string', language:'string', regionId:'uuid' },
      responseShape: { id:'uuid', cdnUrl:'string' },
      statusCodes: [201,400,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
    { method: 'GET',  path: '/regions',
      responseShape: { data:[{ id:'uuid', code:'string', name:'string', continent:'string' }] },
      statusCodes: [200], headers: {}, paginationType: 'none' },
    { method: 'GET',  path: '/replication/status',
      responseShape: { pending:'int', applied:'int', failed:'int' },
      statusCodes: [200,401,403], headers: { Authorization:'Bearer <admin-token>' }, paginationType: 'none' },
  ],
  graphqlOperations: [],
};

/** File Converter — Job/File/Worker with Kafka + S3 presigned uploads */
const fileConverterLldState = {
  archDecisions: { db_type: 'sql', message_queue: 'kafka', storage: 's3' },
  dbType: 'sql', dbTypeSwitched: false, apiStyle: 'rest', submittedWithWarnings: false,
  entities: [
    { id: 'e-job', name: 'Job', isSeeded: true, position: { x: 80, y: 80 }, fields: [
      { name: 'id',           type: 'uuid',      isPrimaryKey: true },
      { name: 'status',       type: 'enum',      enumValues: ['QUEUED','PROCESSING','DONE','FAILED'], hasIndex: true },
      { name: 'inputFormat',  type: 'string',    isRequired: true },
      { name: 'outputFormat', type: 'string',    isRequired: true },
      { name: 'fileId',       type: 'uuid',      references: 'File',   hasIndex: true },
      { name: 'workerId',     type: 'uuid',      references: 'Worker' },
      { name: 'priority',     type: 'int',       hasIndex: true },
      { name: 'retryCount',   type: 'int' },
      { name: 'createdAt',    type: 'timestamp', hasIndex: true },
      { name: 'completedAt',  type: 'timestamp' },
    ]},
    { id: 'e-file', name: 'File', isSeeded: true, position: { x: 440, y: 80 }, fields: [
      { name: 'id',         type: 'uuid',      isPrimaryKey: true },
      { name: 's3Key',      type: 'string',    isRequired: true, hasIndex: true },
      { name: 's3Bucket',   type: 'string',    isRequired: true },
      { name: 'filename',   type: 'string',    isRequired: true },
      { name: 'sizeBytes',  type: 'int' },
      { name: 'mimeType',   type: 'string',    hasIndex: true },
      { name: 'uploadedAt', type: 'timestamp' },
    ]},
    { id: 'e-worker', name: 'Worker', isSeeded: true, position: { x: 80, y: 380 }, fields: [
      { name: 'id',             type: 'uuid',      isPrimaryKey: true },
      { name: 'status',         type: 'enum',      enumValues: ['IDLE','BUSY','OFFLINE'], hasIndex: true },
      { name: 'lastHeartbeat',  type: 'timestamp', hasIndex: true },
      { name: 'processedCount', type: 'int' },
      { name: 'errorCount',     type: 'int' },
      { name: 'registeredAt',   type: 'timestamp' },
    ]},
  ],
  relationships: [
    { fromEntity: 'Job',    toEntity: 'File',   type: 'one-to-one',  label: 'converts' },
    { fromEntity: 'Worker', toEntity: 'Job',    type: 'one-to-many', label: 'processes' },
  ],
  restEndpoints: [
    { method: 'POST',   path: '/jobs',
      requestBody: { inputFormat:'string', outputFormat:'string', fileId:'uuid', priority:'int' },
      responseShape: { id:'uuid', status:'QUEUED', queuePosition:'int' },
      statusCodes: [201,400,401,429], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
    { method: 'GET',    path: '/jobs/:id',
      responseShape: { id:'uuid', status:'string', progress:'int', outputFileId:'uuid' },
      statusCodes: [200,401,404], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
    { method: 'GET',    path: '/jobs',
      responseShape: { data:[{ id:'uuid', status:'string', createdAt:'timestamp' }], nextCursor:'string' },
      statusCodes: [200,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'cursor' },
    { method: 'DELETE', path: '/jobs/:id',
      responseShape: { cancelled: true },
      statusCodes: [200,401,404,409], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
    { method: 'POST',   path: '/files/upload-url',
      requestBody: { filename:'string', mimeType:'string', sizeBytes:'int' },
      responseShape: { presignedUrl:'string', fileId:'uuid', expiresIn:'int' },
      statusCodes: [200,400,401], headers: { Authorization:'Bearer <token>' }, paginationType: 'none' },
  ],
  graphqlOperations: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeSimpleArch(types: string[]) {
  const components = types.map((type, i) => ({
    id: `s${i + 1}`, type, x: 100 + i * 220, y: 300,
  }));
  const connections = components.slice(0, -1).map((c, i) => ({
    from: c.id, to: components[i + 1].id,
  }));
  return { components, connections };
}

function calculateLevel(xp: number): number {
  if (xp < 100)  return 1;
  if (xp < 300)  return 2;
  if (xp < 600)  return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  return Math.floor(xp / 300) + 1;
}

function entitiesToClassDesign(entities: typeof mvpLldState.entities): string {
  return entities
    .map(e => `${e.name}: ${e.fields.map(f => `${f.name} (${f.type}${f.isPrimaryKey ? ', PK' : ''})`).join(', ')}`)
    .join('\n');
}

function entitiesToSchema(entities: typeof mvpLldState.entities): string {
  return entities.map(e => {
    const fields = e.fields.map(f => `${f.name} ${f.type}`).join(', ');
    const idx    = e.fields.filter(f => f.hasIndex).map(f => f.name).join(', ');
    return `${e.name}(${fields})${idx ? ` INDEX ON (${idx})` : ''}`;
  }).join('\n');
}

function endpointsToText(endpoints: typeof mvpLldState.restEndpoints): string {
  return endpoints
    .map(ep => `${ep.method} ${ep.path} → ${JSON.stringify(ep.responseShape)}`)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎬  SystemQuest — Demo Data Seed\n');

  const DEMO_EMAIL    = requireEnv('DEMO_SEED_EMAIL');
  const DEMO_PASSWORD = requireEnv('DEMO_SEED_PASSWORD');
  const DEMO_USERNAME = process.env.DEMO_SEED_USERNAME ?? 'SysQuestDemo';

  // ── Step 1: Create the Stock Exchange capstone mission ───────────────────────
  console.log('📋  Step 1 — Creating "How Stock Exchange Works" capstone mission…');
  await prisma.mission.upsert({
    where:  { slug: 'how-stock-exchange-works' },
    update: {},
    create: {
      slug: 'how-stock-exchange-works', title: 'Mission 50: How Stock Exchange Works',
      difficulty: 5, estimatedTime: '50–60 min', xpReward: 600, order: 50,
      learningPath: 'consistency', skillLevel: 'advanced',
      description: 'Design a stock exchange order matching engine (like NYSE) processing 1M orders/second with microsecond latency, strict FIFO guarantee, and zero duplicate executions.',
      scenario: "You're the lead architect for NYSE's next-generation trading platform. 1M orders/second. Microsecond matching latency. Zero tolerance for lost or duplicated orders. Circuit breakers must halt trading during market disruptions. Design the full order processing pipeline.",
      objectives: JSON.stringify([
        'Process 1M orders/second with under 1ms matching latency',
        'Guarantee FIFO order matching per price level — no race conditions',
        'Achieve 99.999% availability with zero order loss',
        'Implement circuit breaker for market halt within 50ms',
        'Maintain complete immutable audit log of every trade',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000000, daily: 500000000 },
        performance: { latencyMs: 1, availability: 99.999 },
        budget: 100000, growth: '1M orders/sec, microsecond SLA — NYSE-scale',
        required: ['client', 'server', 'database', 'queue', 'monitoring'],
        bonus: [
          { component: 'cache',        xp: 50, label: 'Add order-book cache for market data feed (+50 XP)' },
          { component: 'storage',      xp: 45, label: 'Add immutable audit-log storage (+45 XP)' },
          { component: 'apigateway',   xp: 40, label: 'Add API Gateway for FIX protocol ingress (+40 XP)' },
          { component: 'loadbalancer', xp: 35, label: 'Add Load Balancer for market data fanout (+35 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ['client','loadbalancer','server','database','cache','cdn','queue','storage','monitoring','apigateway'],
        required: ['client','server','database','queue','monitoring'],
        hints: [
          'Queue is the order ingestion layer — 1M orders/sec land in Kafka before any matching begins',
          'Matching Engine (Server) is single-threaded per symbol — sequential FIFO, no locks needed',
          'Database stores the settled order book + trade history — must be ACID compliant',
          'Monitoring is REQUIRED — circuit breaker fires when error rate > 0.01% or latency > 5ms',
          'Cache holds the live order book (bid/ask levels) for real-time market data feed consumers',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Order matching is single-threaded by design — sequential processing eliminates lock contention',
          'Event sourcing: every order-state change is immutable — replay the log to reconstruct any historical order book',
          'NYSE Limit Up / Limit Down: circuit breaker halts a stock when price moves > 5% in 5 minutes',
          'CQRS: write side (matching engine) is fully separate from read side (market data feed, analytics dashboards)',
        ],
        nextMission: null,
        nextPreview: 'Consistency & Transactions complete — you are a distributed systems architect!',
      }),
    },
  });
  console.log('  ✅  how-stock-exchange-works (order 50, 600 XP)\n');

  // ── Step 2: Upsert demo user ─────────────────────────────────────────────────
  console.log('👤  Step 2 — Creating demo user…');
  const totalXp = 6679;
  const level   = calculateLevel(totalXp); // → 23
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demoUser = await prisma.user.upsert({
    where:  { email: DEMO_EMAIL },
    update: { passwordHash, xp: totalXp, level, skillLevel: 'advanced', username: DEMO_USERNAME },
    create: { email: DEMO_EMAIL, username: DEMO_USERNAME, passwordHash, xp: totalXp, level, skillLevel: 'advanced' },
  });
  console.log(`  ✅  ${DEMO_USERNAME} — Level ${level} | ${totalXp} XP | advanced\n`);

  // ── Step 3: Resolve mission IDs ──────────────────────────────────────────────
  console.log('🔍  Step 3 — Resolving mission IDs…');
  const targetSlugs = [
    'mvp-launch','scaling-up','global-expansion','design-chatgpt',
    'secure-the-gates','the-file-converter','notification-engine','rest-vs-graphql',
    'file-converter','code-judge',
    'url-shortener','search-engine',
    'live-scoreboard','ride-hailing',
    'social-feed','video-streaming',
    'booking-system',
    'design-whatsapp','payment-processing',
  ];
  const found      = await prisma.mission.findMany({ where: { slug: { in: targetSlugs } }, select: { id: true, slug: true, xpReward: true, title: true } });
  const missionMap = new Map(found.map(m => [m.slug, m]));
  const missing    = targetSlugs.filter(s => !missionMap.has(s));
  if (missing.length) console.warn(`  ⚠️   Missing from DB (run all seed files first): ${missing.join(', ')}`);
  console.log(`  ✅  ${found.length}/${targetSlugs.length} missions resolved\n`);

  // ── Step 4: HLD completed attempts ──────────────────────────────────────────
  console.log('🎮  Step 4 — Seeding HLD completed mission attempts…');
  const completedMissions: Array<{ slug: string; score: number; arch: object }> = [
    { slug: 'mvp-launch',         score: 92, arch: makeSimpleArch(['client','server','database']) },
    { slug: 'scaling-up',         score: 88, arch: makeSimpleArch(['client','loadbalancer','server','server','cache','database']) },
    { slug: 'global-expansion',   score: 85, arch: makeSimpleArch(['client','cdn','loadbalancer','server','cache','database']) },
    { slug: 'design-chatgpt',     score: 82, arch: makeSimpleArch(['client','apigateway','server','cache','queue','server','database','monitoring']) },
    { slug: 'secure-the-gates',   score: 83, arch: makeSimpleArch(['client','apigateway','server','cache','database','monitoring']) },
    { slug: 'the-file-converter', score: 81, arch: makeSimpleArch(['client','apigateway','server','queue','server','storage','database']) },
    { slug: 'notification-engine',score: 82, arch: makeSimpleArch(['client','server','queue','server','database','monitoring']) },
    { slug: 'rest-vs-graphql',    score: 80, arch: makeSimpleArch(['client','apigateway','server','cache','database']) },
    { slug: 'file-converter',     score: 85, arch: makeSimpleArch(['client','apigateway','server','queue','server','storage','database']) },
    { slug: 'code-judge',         score: 82, arch: makeSimpleArch(['client','apigateway','loadbalancer','server','queue','server','database','monitoring']) },
    { slug: 'url-shortener',      score: 91, arch: urlShortenerArch },
    { slug: 'search-engine',      score: 80, arch: makeSimpleArch(['client','apigateway','loadbalancer','server','cache','database','storage']) },
    { slug: 'live-scoreboard',    score: 79, arch: makeSimpleArch(['client','loadbalancer','server','server','cache','queue','database']) },
    { slug: 'ride-hailing',       score: 78, arch: makeSimpleArch(['client','apigateway','loadbalancer','server','server','cache','database','queue']) },
    { slug: 'social-feed',        score: 78, arch: makeSimpleArch(['client','cdn','apigateway','loadbalancer','server','cache','queue','database','storage']) },
    { slug: 'video-streaming',    score: 79, arch: makeSimpleArch(['client','cdn','loadbalancer','server','queue','storage','database','monitoring']) },
    { slug: 'booking-system',     score: 82, arch: makeSimpleArch(['client','apigateway','loadbalancer','server','server','cache','database','monitoring']) },
  ];
  for (const { slug, score, arch } of completedMissions) {
    const mission = missionMap.get(slug);
    if (!mission) continue;
    const xpEarned = Math.round((score / 100) * mission.xpReward);
    await prisma.missionAttempt.deleteMany({ where: { userId: demoUser.id, missionId: mission.id } });
    await prisma.missionAttempt.create({
      data: {
        userId: demoUser.id, missionId: mission.id, score, xpEarned,
        completed: true, comparisonViewed: true,
        architecture: JSON.stringify(arch),
        metrics: JSON.stringify({
          latencyMs: Math.max(50, 320 - score * 2),
          availability: parseFloat(Math.min(99.9, 95 + score * 0.049).toFixed(2)),
          throughput: score * 110, monthlyCost: 300 + score * 5,
          score, allMetricsMet: score >= 80, xpEarned,
          bonusXp: score >= 85 ? 50 : 0, feedback: [],
          achievements: score >= 80 ? ['first-architecture'] : [],
        }),
      },
    });
    console.log(`  ✅  ${mission.title.padEnd(42)} score: ${score}  xp: ${xpEarned}`);
  }

  // ── Step 5: In-progress canvas prefill ──────────────────────────────────────
  console.log('\n🎨  Step 5 — Saving prefilled in-progress architectures…');
  for (const { slug, arch, label } of [
    { slug: 'design-whatsapp',    arch: whatsappArch, label: 'Design WhatsApp — WebSocket + Queue + Cassandra + S3' },
    { slug: 'payment-processing', arch: paymentArch,  label: 'Payment Processing — Stripe-style idempotency + ACID' },
  ]) {
    const mission = missionMap.get(slug);
    if (!mission) continue;
    await prisma.missionAttempt.deleteMany({ where: { userId: demoUser.id, missionId: mission.id } });
    await prisma.missionAttempt.create({
      data: { userId: demoUser.id, missionId: mission.id, score: 0, xpEarned: 0, completed: false, architecture: JSON.stringify(arch), metrics: JSON.stringify({}) },
    });
    console.log(`  🎨  ${label}`);
  }

  // ── Step 6: Mistake Patterns ─────────────────────────────────────────────────
  console.log('\n⚠️   Step 6 — Seeding Mistake Patterns…');
  for (const p of [
    { dimension:'api-design',  patternSlug:'missing-rate-limiter',       patternName:'Missing Rate Limiter',                    frequency:3, affectedMissions:JSON.stringify(['url-shortener','mvp-launch','global-expansion']),    conceptSlug:'rate-limiting',   isResolved:false },
    { dimension:'reliability', patternSlug:'single-database-spof',       patternName:'Single Database — No Read Replica',        frequency:2, affectedMissions:JSON.stringify(['design-whatsapp','live-scoreboard']),               conceptSlug:'availability',    isResolved:false },
    { dimension:'consistency', patternSlug:'synchronous-critical-path',  patternName:'Synchronous Payment Call (Queue Missing)',  frequency:2, affectedMissions:JSON.stringify(['payment-processing','booking-system']),             conceptSlug:'saga-pattern',    isResolved:false },
    { dimension:'reliability', patternSlug:'no-dead-letter-queue',       patternName:'No Dead Letter Queue for Failed Events',   frequency:2, affectedMissions:JSON.stringify(['live-scoreboard','ride-hailing']),                  conceptSlug:'message-queues',  isResolved:false },
  ]) {
    await prisma.mistakePattern.upsert({
      where:  { userId_patternSlug: { userId: demoUser.id, patternSlug: p.patternSlug } },
      update: { frequency: p.frequency, affectedMissions: p.affectedMissions, isResolved: false, lastSeenAt: new Date() },
      create: { userId: demoUser.id, ...p },
    });
    console.log(`  ⚠️   ${p.patternName.padEnd(42)} (${p.dimension})  freq: ${p.frequency}`);
  }

  // ── Step 7: LLD pre-filled attempts (interactive builder showcase) ────────────
  console.log('\n🏗️   Step 7 — Seeding rich LLD attempts (interactive builder)…');
  const lldMissions: Array<{ slug: string; state: object; score: number }> = [
    { slug: 'mvp-launch',       state: mvpLldState,           score: 88 },
    { slug: 'scaling-up',       state: scalingLldState,       score: 91 },
    { slug: 'global-expansion', state: globalLldState,        score: 93 },
    { slug: 'file-converter',   state: fileConverterLldState, score: 90 },
  ];
  for (const { slug, state, score } of lldMissions) {
    const mission = missionMap.get(slug);
    if (!mission) continue;
    const s          = state as typeof mvpLldState;
    const classDesign  = entitiesToClassDesign(s.entities);
    const dataSchema   = entitiesToSchema(s.entities);
    const apiContracts = endpointsToText(s.restEndpoints);
    const xpEarned     = Math.round(score / 100 * 150); // MAX_LLD_XP = 150
    await prisma.lLDAttempt.deleteMany({ where: { userId: demoUser.id, missionId: mission.id } });
    await prisma.lLDAttempt.create({
      data: {
        userId: demoUser.id, missionId: mission.id,
        classDesign, apiContracts, dataSchema,
        score, xpEarned,
        lldState: JSON.stringify(state),
        feedback: JSON.stringify(lldGoodFeedback),
      },
    });
    console.log(`  🏗️   ${mission.title.padEnd(42)} score: ${score}  xp: ${xpEarned}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬  DEMO SEED COMPLETE

  Login:    ${DEMO_EMAIL}  (password from DEMO_SEED_PASSWORD)
  User:     ${DEMO_USERNAME}  |  Level ${level}  |  ${totalXp} XP  |  advanced

  ✅  17 HLD missions completed — all path cards unlocked
  🏗️   4 LLD attempts pre-filled (mvp-launch, scaling-up, global-expansion, file-converter)
  🎨  2 in-progress canvas prefills (design-whatsapp, payment-processing)
  🔒  2 locked showcases (design-slack, how-stock-exchange-works)
  ⚠️   4 mistake patterns active
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
