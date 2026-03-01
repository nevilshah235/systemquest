/**
 * solutions.ts
 * Optimal "reference" architectures for each mission used by SolutionViewer.
 * Sprint 3 missions (26-40) and concept-depth missions (41-48) are merged at module load.
 */

import { Architecture, COMPONENT_META, ComponentType } from './types';
import { SPRINT3_SOLUTIONS } from './solutions-sprint3';
import { SPRINT3_CONCEPT_SOLUTIONS } from './solutions-sprint3-concepts';

export interface MissionSolution {
  architecture: Architecture;
  /** Ordered steps explaining how to build this architecture */
  steps: string[];
  /** One-paragraph explanation of why this design works */
  explanation: string;
}

export const MISSION_SOLUTIONS: Record<string, MissionSolution> = {

  // ── Mission 1: MVP Launch ────────────────────────────────────────────────────────
  'mvp-launch': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',       x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',           x: 560, y: 40  },
        { id: 'sol-lb',         type: 'loadbalancer',  x: 300, y: 160 },
        { id: 'sol-server1',    type: 'server',        x: 160, y: 300 },
        { id: 'sol-server2',    type: 'server',        x: 440, y: 300 },
        { id: 'sol-monitoring', type: 'monitoring',    x: 640, y: 300 },
        { id: 'sol-cache',      type: 'cache',         x: 300, y: 420 },
        { id: 'sol-db',         type: 'database',      x: 300, y: 540 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-lb'      },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc5',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc6',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc7',  from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc8',  from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc9',  from: 'sol-monitoring', to: 'sol-server2' },
      ],
    },
    steps: [
      'Place Client → Load Balancer → 2 App Servers (handles 1k users, eliminates SPOF)',
      'Connect both servers to Cache, then Cache → Database (Server → Cache → DB path)',
      'Add CDN off the Client for static asset delivery',
      'Add Monitoring to push availability to 99%',
    ],
    explanation:
      'Two App Servers behind a Load Balancer handle 1,000 concurrent users and remove the single point of failure. A Cache between the servers and the Database cuts latency to sub-200ms. CDN offloads static assets, and Monitoring provides the observability needed for 99% uptime.',
  },

  // ── Mission 2: Scaling Up ────────────────────────────────────────────────────────
  'scaling-up': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',       x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',           x: 580, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',   x: 300, y: 150 },
        { id: 'sol-lb',         type: 'loadbalancer',  x: 300, y: 270 },
        { id: 'sol-server1',    type: 'server',        x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',        x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',        x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',    x: 700, y: 400 },
        { id: 'sol-cache',      type: 'cache',         x: 190, y: 530 },
        { id: 'sol-queue',      type: 'queue',         x: 420, y: 530 },
        { id: 'sol-db',         type: 'database',      x: 190, y: 650 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc11', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Add API Gateway to manage and throttle 10k incoming requests',
      'Scale to 3 App Servers behind the Load Balancer for throughput',
      'Connect 2 servers to Cache → DB; 3rd server feeds the Queue for async tasks',
      'Add CDN + Monitoring for 99.9% availability',
    ],
    explanation:
      'Scaling to 10k users requires three App Servers behind a Load Balancer plus an API Gateway for traffic management. A Cache slashes DB round-trips to hit 150ms latency. A Queue decouples heavy background tasks. CDN and Monitoring together push availability to 99.9%.',
  },

  // ── Mission 3: Global Expansion ───────────────────────────────────────────────────
  'global-expansion': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',       x: 300, y: 30  },
        { id: 'sol-cdn',        type: 'cdn',           x: 580, y: 30  },
        { id: 'sol-apigw',      type: 'apigateway',   x: 300, y: 140 },
        { id: 'sol-lb',         type: 'loadbalancer',  x: 300, y: 260 },
        { id: 'sol-server1',    type: 'server',        x: 80,  y: 390 },
        { id: 'sol-server2',    type: 'server',        x: 300, y: 390 },
        { id: 'sol-server3',    type: 'server',        x: 520, y: 390 },
        { id: 'sol-monitoring', type: 'monitoring',    x: 700, y: 390 },
        { id: 'sol-cache1',     type: 'cache',         x: 80,  y: 520 },
        { id: 'sol-cache2',     type: 'cache',         x: 300, y: 520 },
        { id: 'sol-queue',      type: 'queue',         x: 520, y: 520 },
        { id: 'sol-db',         type: 'database',      x: 190, y: 640 },
        { id: 'sol-storage',    type: 'storage',       x: 420, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache1'  },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-cache2'  },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-cache1',  to: 'sol-db'      },
        { id: 'sc11', from: 'sol-cache2',  to: 'sol-db'      },
        { id: 'sc12', from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc14', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc15', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'CDN + API Gateway handle global routing and edge delivery',
      'Load Balancer + 3 App Servers cover 100k concurrent users',
      'Two Cache layers (one per server group) keep latency under 100ms globally',
      'Queue feeds into Storage for distributed async file processing',
      'Monitoring across all servers achieves 99.99% uptime',
    ],
    explanation:
      'Global scale demands CDN for edge delivery, API Gateway for geo-routing, 3 App Servers behind a Load Balancer for throughput, two Cache layers for sub-100ms latency everywhere, a Queue + Storage tier for async media workloads, and full Monitoring for five-nines availability.',
  },

  // ── Mission 4: File Converter (like Zamzar) ───────────────────────────────────────
  'file-converter': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 120, y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 480, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 680, y: 400 },
        { id: 'sol-queue',      type: 'queue',       x: 120, y: 520 },
        { id: 'sol-storage',    type: 'storage',     x: 300, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 480, y: 520 },
      ],
      connections: [
        { id: 'sc1', from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2', from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc3', from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc4', from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc5', from: 'sol-server1', to: 'sol-queue'   },
        { id: 'sc6', from: 'sol-server2', to: 'sol-queue'   },
        { id: 'sc7', from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc8', from: 'sol-storage', to: 'sol-db'      },
        { id: 'sc9', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc10',from: 'sol-monitoring', to: 'sol-server2' },
      ],
    },
    steps: [
      'Client → API Gateway → Load Balancer → 2 App Servers (upload path)',
      'Both servers publish conversion jobs to the Queue (async decoupling)',
      'Queue → Storage: converted files are saved to object storage, never the DB',
      'Storage → Database: record file metadata (owner, format, expiry)',
      'Add Monitoring to detect stuck conversion workers early',
    ],
    explanation:
      'The API Gateway handles upload rate-limiting, while two App Servers behind a Load Balancer ingest 5,000 concurrent uploads. A Queue decouples ingestion from CPU-intensive conversion workers, keeping API latency under 280ms. Storage holds the binary files, the Database only tracks metadata, and Monitoring fires alerts when conversion jobs stall.',
  },

  // ── Mission 5: URL Shortener (like Bitly) ─────────────────────────────────────────
  'url-shortener': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',         x: 580, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 60,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 540, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 720, y: 400 },
        { id: 'sol-cache',      type: 'cache',       x: 180, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 420, y: 520 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-cache'   },
        { id: 'sc10', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc11', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Client → API Gateway (rate-limit write requests); Client → CDN (serve landing pages)',
      'API Gateway → Load Balancer → 3 App Servers for 50k concurrent redirects',
      'All servers read from Cache first (99% hit rate) → Database only on cache miss',
      'Add Monitoring to track cache hit rates and redirect latency',
    ],
    explanation:
      'URL shorteners are read-dominated — 99% of traffic is redirect lookups, not link creation. Three App Servers behind a Load Balancer handle 50k concurrent requests. A shared Cache layer serves 99% of redirects without touching the Database, keeping latency at 160ms. CDN serves preview pages at the edge, and API Gateway prevents link-spam abuse.',
  },

  // ── Mission 6: Live Scoreboard (like CricBuzz) ──────────────────────────────────
  'live-scoreboard': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',         x: 580, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 40,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 190, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 410, y: 400 },
        { id: 'sol-server4',    type: 'server',      x: 560, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 720, y: 400 },
        { id: 'sol-queue',      type: 'queue',       x: 140, y: 520 },
        { id: 'sol-cache',      type: 'cache',       x: 420, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 280, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-lb',      to: 'sol-server4' },
        { id: 'sc8',  from: 'sol-server1', to: 'sol-queue'   },
        { id: 'sc9',  from: 'sol-server2', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-server3', to: 'sol-cache'   },
        { id: 'sc11', from: 'sol-server4', to: 'sol-cache'   },
        { id: 'sc12', from: 'sol-queue',   to: 'sol-db'      },
        { id: 'sc13', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc14', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc15', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc16', from: 'sol-monitoring', to: 'sol-server3' },
        { id: 'sc17', from: 'sol-monitoring', to: 'sol-server4' },
      ],
    },
    steps: [
      'Client → API Gateway + CDN (static assets at edge); API GW → Load Balancer',
      'Load Balancer routes to 4 App Servers to handle 80k spike traffic',
      'Score-update servers publish events to the Queue (pub/sub broadcast)',
      'Read servers pull the latest score from Cache — never from the Database directly',
      'Queue persists events to Database for history; Monitoring watches all servers',
    ],
    explanation:
      'A live scoreboard with 80,000 concurrent viewers cannot afford database reads per request. Four App Servers behind a Load Balancer absorb the traffic spike. Score updates publish to a Queue for fan-out; viewers read the latest score from Cache in memory, keeping latency at 140ms. CDN offloads static match assets, and Monitoring fires alerts if a server falls behind event consumption.',
  },

  // ── Mission 7: Code Judge (like Codeforces) ──────────────────────────────────────
  'code-judge': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 700, y: 400 },
        { id: 'sol-queue',      type: 'queue',       x: 140, y: 520 },
        { id: 'sol-storage',    type: 'storage',     x: 300, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 460, y: 520 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc6',  from: 'sol-server1', to: 'sol-queue'   },
        { id: 'sc7',  from: 'sol-server2', to: 'sol-queue'   },
        { id: 'sc8',  from: 'sol-server3', to: 'sol-storage' },
        { id: 'sc9',  from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc10', from: 'sol-storage', to: 'sol-db'      },
        { id: 'sc11', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Client → API Gateway (auth + rate-limit) → Load Balancer → 3 Worker Servers',
      'Submission servers publish jobs to the Queue for async code execution',
      'Workers pull from Queue and write compiled artifacts to Storage',
      'Storage → Database: persist verdict, test output, and execution stats',
      'Monitoring watches queue depth and kills runaway execution jobs',
    ],
    explanation:
      'Code execution is CPU-intensive and unpredictable in duration. Three App Servers behind a Load Balancer accept 2,000 concurrent submissions. The Queue decouples ingestion from execution workers, so the API returns 202 Accepted immediately. Storage holds source files and test outputs safely. Monitoring is critical for detecting malicious infinite loops or memory exhaustion.',
  },

  // ── Mission 8: Search Engine ───────────────────────────────────────────────────────────
  'search-engine': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',         x: 580, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 700, y: 400 },
        { id: 'sol-cache',      type: 'cache',       x: 80,  y: 520 },
        { id: 'sol-queue',      type: 'queue',       x: 300, y: 520 },
        { id: 'sol-storage',    type: 'storage',     x: 520, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 300, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-queue'   },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-storage' },
        { id: 'sc10', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc11', from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc12', from: 'sol-storage', to: 'sol-db'      },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc14', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc15', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Client → API Gateway + CDN (serve autocomplete and static search UI at the edge)',
      'Load Balancer → 3 App Servers: query servers read Cache, indexers write via Queue',
      'Cache serves top-1000 queries in memory — eliminates repeated index traversals',
      'Queue feeds async indexing workers that update Storage (index shards)',
      'Storage → Database: persist indexed document metadata and ranking signals',
    ],
    explanation:
      'Search is split into a read path and a write path. Query servers read results from Cache (hot queries) or the Database (index). Indexing workers consume document events from the Queue and write updated index shards to Storage asynchronously. Three App Servers handle 75k concurrent queries at 135ms. CDN accelerates autocomplete, and Monitoring tracks query latency and index freshness.',
  },

  // ── Mission 9: Booking System (like Airbnb) ─────────────────────────────────────
  'booking-system': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 700, y: 400 },
        { id: 'sol-cache',      type: 'cache',       x: 80,  y: 520 },
        { id: 'sol-queue',      type: 'queue',       x: 300, y: 520 },
        { id: 'sol-storage',    type: 'storage',     x: 500, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 190, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc6',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc7',  from: 'sol-server2', to: 'sol-queue'   },
        { id: 'sc8',  from: 'sol-server3', to: 'sol-storage' },
        { id: 'sc9',  from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc10', from: 'sol-queue',   to: 'sol-db'      },
        { id: 'sc11', from: 'sol-storage', to: 'sol-db'      },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc14', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Client → API Gateway (auth + bot rate-limiting) → Load Balancer → 3 App Servers',
      'Cache holds distributed availability locks — acquired before writing to the DB',
      'Queue serializes concurrent booking requests for the same property ID',
      'Storage saves booking confirmation PDFs and receipt documents',
      'Database commits the atomic booking record after the lock is confirmed',
    ],
    explanation:
      'Double-booking prevention requires two things: a Cache lock (optimistic concurrency) acquired before any booking attempt, and a Queue that serializes requests for the same property. Three App Servers handle 10k concurrent requests. The API Gateway rate-limits bots. Monitoring fires alerts when lock contention spikes, indicating a flash-sale event.',
  },

  // ── Mission 10: Social Feed (like Twitter) ────────────────────────────────────────
  'social-feed': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 30  },
        { id: 'sol-cdn',        type: 'cdn',         x: 580, y: 30  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 140 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 260 },
        { id: 'sol-server1',    type: 'server',      x: 40,  y: 380 },
        { id: 'sol-server2',    type: 'server',      x: 180, y: 380 },
        { id: 'sol-server3',    type: 'server',      x: 420, y: 380 },
        { id: 'sol-server4',    type: 'server',      x: 560, y: 380 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 720, y: 380 },
        { id: 'sol-cache',      type: 'cache',       x: 80,  y: 500 },
        { id: 'sol-queue',      type: 'queue',       x: 300, y: 500 },
        { id: 'sol-storage',    type: 'storage',     x: 500, y: 500 },
        { id: 'sol-db',         type: 'database',    x: 190, y: 620 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-lb',      to: 'sol-server4' },
        { id: 'sc8',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc9',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc10', from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc11', from: 'sol-server4', to: 'sol-storage' },
        { id: 'sc12', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc13', from: 'sol-queue',   to: 'sol-db'      },
        { id: 'sc14', from: 'sol-cdn',     to: 'sol-storage' },
        { id: 'sc15', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc16', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc17', from: 'sol-monitoring', to: 'sol-server3' },
        { id: 'sc18', from: 'sol-monitoring', to: 'sol-server4' },
      ],
    },
    steps: [
      'Client → API Gateway + CDN (media delivery at edge); 4 App Servers behind Load Balancer',
      'Post events published to Queue — fan-out workers write to follower Caches (fan-out on write)',
      'Feed readers pull pre-computed timelines from Cache — never from the Database',
      'Media uploads go to Storage; CDN serves images and videos from Storage at edge',
      'Database is the source of truth; Cache is the primary read path for all feed queries',
    ],
    explanation:
      "Fan-out on write is the key pattern: when a user posts, the Queue broadcasts the event to workers that pre-write the post into each follower's cached timeline. Feed readers get sub-160ms responses because they only read from Cache. Four App Servers handle 500k concurrent readers. CDN + Storage deliver media without touching app servers, and Monitoring watches fan-out lag for viral posts.",
  },

  // ── Mission 11: Ride Hailing (like Uber) ─────────────────────────────────────────
  'ride-hailing': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',         x: 580, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 700, y: 400 },
        { id: 'sol-cache',      type: 'cache',       x: 140, y: 520 },
        { id: 'sol-queue',      type: 'queue',       x: 420, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 280, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc11', from: 'sol-queue',   to: 'sol-db'      },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc14', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Client → API Gateway (WebSocket upgrades for real-time driver streams); CDN for map tiles',
      'Load Balancer → 3 App Servers: location servers write to Cache; match servers read from it',
      'Cache stores live driver GPS coordinates — updated every 3 seconds from driver apps',
      'Queue decouples ride-request events from matching algorithm workers',
      'Database persists completed trip records; Monitoring watches match latency',
    ],
    explanation:
      'Real-time driver matching requires Cache as the primary geo-index — database reads would add 40ms of unnecessary latency per query. Three App Servers handle location updates and ride requests: location servers write driver coordinates to Cache every 3s, and matching servers query the nearest driver from Cache. A Queue buffers burst demand during rush hour. CDN serves map tiles at the edge, and API Gateway manages WebSocket connections for live location streaming.',
  },

  // ── Mission 12: Video Streaming (like Netflix) ────────────────────────────────────
  'video-streaming': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 30  },
        { id: 'sol-cdn',        type: 'cdn',         x: 580, y: 30  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 140 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 260 },
        { id: 'sol-server1',    type: 'server',      x: 40,  y: 380 },
        { id: 'sol-server2',    type: 'server',      x: 180, y: 380 },
        { id: 'sol-server3',    type: 'server',      x: 420, y: 380 },
        { id: 'sol-server4',    type: 'server',      x: 560, y: 380 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 720, y: 380 },
        { id: 'sol-cache',      type: 'cache',       x: 80,  y: 500 },
        { id: 'sol-queue',      type: 'queue',       x: 300, y: 500 },
        { id: 'sol-storage',    type: 'storage',     x: 500, y: 500 },
        { id: 'sol-db',         type: 'database',    x: 190, y: 620 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-lb',      to: 'sol-server4' },
        { id: 'sc8',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc9',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc10', from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc11', from: 'sol-server4', to: 'sol-storage' },
        { id: 'sc12', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc13', from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc14', from: 'sol-cdn',     to: 'sol-storage' },
        { id: 'sc15', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc16', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc17', from: 'sol-monitoring', to: 'sol-server3' },
        { id: 'sc18', from: 'sol-monitoring', to: 'sol-server4' },
      ],
    },
    steps: [
      'Client → CDN: video bytes MUST come from CDN edge — never directly from origin',
      'API Gateway + Load Balancer route metadata and session requests to 4 App Servers',
      'Cache stores video metadata, watch progress, and personalised recommendations',
      'Queue handles async transcoding jobs (480p, 720p, 1080p, 4K renditions per title)',
      'Storage holds all encoded video chunks; CDN pulls from Storage for edge caching',
    ],
    explanation:
      'Video streaming at 500k concurrent viewers is only possible because CDN edge nodes serve video bytes — origin servers handle only metadata and session management. Four App Servers process 500k session requests. Cache serves metadata in memory. A Queue drives async transcoding so uploads are non-blocking. Storage holds the full video corpus, which CDN pre-warms at the edge for popular titles.',
  },

  // ── Mission 13: Payment Processing (like Stripe) ──────────────────────────────────
  'payment-processing': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',      x: 300, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',         type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-server1',    type: 'server',      x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',      x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',      x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',  x: 700, y: 400 },
        { id: 'sol-queue',      type: 'queue',       x: 180, y: 520 },
        { id: 'sol-db',         type: 'database',    x: 420, y: 520 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc6',  from: 'sol-server1', to: 'sol-queue'   },
        { id: 'sc7',  from: 'sol-server2', to: 'sol-queue'   },
        { id: 'sc8',  from: 'sol-server3', to: 'sol-db'      },
        { id: 'sc9',  from: 'sol-queue',   to: 'sol-db'      },
        { id: 'sc10', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc11', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Client → API Gateway (TLS termination, auth, signature verification)',
      'Load Balancer → 3 App Servers: each server verifies idempotency key before processing',
      'Payment events published to Queue with idempotency key — guarantees exactly-once processing',
      'Queue consumers commit the ACID transaction to the Database',
      'Monitoring is mandatory: every payment failure triggers an immediate on-call alert',
    ],
    explanation:
      'Payment systems have zero tolerance for double charges or lost transactions. The API Gateway enforces TLS and signature verification. Three App Servers handle 5k concurrent requests. Idempotency keys are attached to Queue messages, so retries never double-charge. Monitoring is not optional in fintech: every anomaly must page on-call within seconds.',
  },

};

// ── Merge Sprint 3 solutions (missions 26–40 and concept-depth missions 41–48) ─────────────
Object.assign(MISSION_SOLUTIONS, SPRINT3_SOLUTIONS, SPRINT3_CONCEPT_SOLUTIONS);

// ── Gap analysis helpers ──────────────────────────────────────────────────────────────────

export interface GapItem {
  type: string;
  needed: number;
  have: number;
  missing: number;
}

/** Compares the current canvas architecture against the optimal solution. */
export function computeGap(current: Architecture, missionSlug: string): GapItem[] {
  const solution = MISSION_SOLUTIONS[missionSlug];
  if (!solution) return [];

  const optimalCounts: Record<string, number> = {};
  for (const c of solution.architecture.components) {
    optimalCounts[c.type] = (optimalCounts[c.type] ?? 0) + 1;
  }

  const currentCounts: Record<string, number> = {};
  for (const c of current.components) {
    currentCounts[c.type] = (currentCounts[c.type] ?? 0) + 1;
  }

  return Object.entries(optimalCounts)
    .map(([type, needed]) => ({ type, needed, have: currentCounts[type] ?? 0, missing: needed - (currentCounts[type] ?? 0) }))
    .filter((g) => g.missing > 0);
}

/** Returns 0-100 optimality score based on fraction of optimal components present. */
export function computeOptimality(current: Architecture, missionSlug: string): number {
  const solution = MISSION_SOLUTIONS[missionSlug];
  if (!solution) return 0;

  const total = solution.architecture.components.length;
  const gap = computeGap(current, missionSlug).reduce((sum, g) => sum + g.missing, 0);
  return Math.round(((total - gap) / total) * 100);
}

// ── Connection topology gap analysis ──────────────────────────────────────────────

export interface ConnectionGapItem {
  from: string;
  to: string;
  needed: number;
  have: number;
  missing: number;
  label: string;
}

/**
 * Compares the connection topology of the current architecture against the
 * optimal solution for a mission.
 */
export function computeConnectionGap(
  current: Architecture,
  missionSlug: string,
): ConnectionGapItem[] {
  const solution = MISSION_SOLUTIONS[missionSlug];
  if (!solution) return [];

  const typeOf = (arch: Architecture, id: string): string | undefined =>
    arch.components.find((c) => c.id === id)?.type;

  const optimalEdges: Record<string, number> = {};
  for (const conn of solution.architecture.connections) {
    const from = typeOf(solution.architecture, conn.from);
    const to   = typeOf(solution.architecture, conn.to);
    if (!from || !to) continue;
    const key = `${from}:${to}`;
    optimalEdges[key] = (optimalEdges[key] ?? 0) + 1;
  }

  const currentEdges: Record<string, number> = {};
  for (const conn of current.connections) {
    const from = typeOf(current, conn.from);
    const to   = typeOf(current, conn.to);
    if (!from || !to) continue;
    const key = `${from}:${to}`;
    currentEdges[key] = (currentEdges[key] ?? 0) + 1;
  }

  return Object.entries(optimalEdges)
    .map(([key, needed]) => {
      const [from, to] = key.split(':');
      const have    = currentEdges[key] ?? 0;
      const missing = Math.max(0, needed - have);
      const fromMeta = COMPONENT_META[from as ComponentType];
      const toMeta   = COMPONENT_META[to as ComponentType];
      return {
        from,
        to,
        needed,
        have,
        missing,
        label: `${fromMeta?.label ?? from} → ${toMeta?.label ?? to}`,
      };
    })
    .filter((g) => g.missing > 0);
}
