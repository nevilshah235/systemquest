import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Achievements
  await prisma.achievement.upsert({
    where: { slug: 'first-architecture' },
    update: {},
    create: {
      slug: 'first-architecture',
      title: 'First Architecture',
      description: 'Complete your first mission',
      icon: '🏗️',
      xpBonus: 50,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'budget-master' },
    update: {},
    create: {
      slug: 'budget-master',
      title: 'Budget Master',
      description: 'Stay under budget by 5%',
      icon: '💰',
      xpBonus: 25,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'speed-demon' },
    update: {},
    create: {
      slug: 'speed-demon',
      title: 'Speed Demon',
      description: 'Achieve sub-170ms latency',
      icon: '⚡',
      xpBonus: 35,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'scale-master' },
    update: {},
    create: {
      slug: 'scale-master',
      title: 'Scale Master',
      description: 'Handle 10,000+ concurrent users',
      icon: '📈',
      xpBonus: 75,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'global-architect' },
    update: {},
    create: {
      slug: 'global-architect',
      title: 'Global Architect',
      description: 'Complete the Global Expansion mission',
      icon: '🌍',
      xpBonus: 100,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'async-master' },
    update: {},
    create: {
      slug: 'async-master',
      title: 'Async Master',
      description: 'Complete the File Converter mission',
      icon: '📁',
      xpBonus: 60,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'cache-king' },
    update: {},
    create: {
      slug: 'cache-king',
      title: 'Cache King',
      description: 'Complete the URL Shortener mission',
      icon: '⚡',
      xpBonus: 70,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'realtime-guru' },
    update: {},
    create: {
      slug: 'realtime-guru',
      title: 'Realtime Guru',
      description: 'Complete the Live Scoreboard mission',
      icon: '🏏',
      xpBonus: 80,
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'system-design-master' },
    update: {},
    create: {
      slug: 'system-design-master',
      title: 'System Design Master',
      description: 'Complete all 13 missions',
      icon: '🏆',
      xpBonus: 500,
    },
  });

  // ── Mission 1: MVP Launch ──────────────────────────────────────────────────
  const mvpComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage'],
    required: ['client', 'server', 'database'],
    hints: [
      'Start with Client → Server → Database — these three are required for your MVP',
      'Add a Load Balancer to distribute traffic and prevent a single point of failure',
      'Add a Cache to reduce database queries and keep costs under $500/month',
      'Add a CDN to serve static assets faster and reduce load on your server',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'mvp-launch' },
    update: { components: mvpComponents },
    create: {
      slug: 'mvp-launch',
      title: 'Mission 1: MVP Launch',
      difficulty: 1,
      estimatedTime: '15-20 min',
      xpReward: 150,
      order: 1,
      description: "Design a system that can handle TechStart's initial user load while staying within budget.",
      scenario: "You're the lead architect at TechStart, a promising startup. The CEO needs to launch the MVP in 2 weeks to secure Series A funding. Your job: design a system that can handle the initial user load while staying within budget.",
      objectives: JSON.stringify([
        'Handle 1,000 concurrent users',
        'Maintain 99% availability',
        'Respond in under 200ms',
        'Stay within $500/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000, daily: 10000 },
        performance: { latencyMs: 200, availability: 99.0 },
        budget: 500,
        growth: '2x in 3 months',
        required: ['client', 'server', 'database'],
        bonus: [
          { component: 'cache', xp: 25, label: 'Add caching layer (+25 XP)' },
          { component: 'monitoring', xp: 15, label: 'Include monitoring (+15 XP)' },
          { component: 'loadbalancer', xp: 35, label: 'Implement auto-scaling (+35 XP)' },
        ],
      }),
      components: mvpComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Load balancers improve availability and distribute traffic',
          'Caching layers significantly reduce database load',
          'Proper architecture planning prevents costly redesigns',
        ],
        nextMission: 'scaling-up',
        nextPreview: 'Your MVP attracted 50,000 users. Time to scale!',
      }),
    },
  });

  // ── Mission 2: Scaling Up ──────────────────────────────────────────────────
  const scalingComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'database', 'cache'],
    hints: [
      'Place a Load Balancer in front of multiple servers to spread the 10k concurrent users',
      'Add a Cache to store frequent database queries in memory — cuts DB load by 80%',
      'Add a Queue to offload background tasks so the server stays responsive',
      'Add the Monitoring component to track response times and catch performance regressions',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'scaling-up' },
    update: { components: scalingComponents },
    create: {
      slug: 'scaling-up',
      title: 'Mission 2: Scaling Up',
      difficulty: 2,
      estimatedTime: '20-30 min',
      xpReward: 300,
      order: 2,
      description: "Your MVP attracted 50,000 users! Now you're facing performance issues. Scale up before users start leaving.",
      scenario: "Success! Your MVP attracted 50,000 users in the first month. The CEO is thrilled, but now you're facing performance issues. Time to scale up before users start leaving.",
      objectives: JSON.stringify([
        'Handle 10,000 concurrent users',
        'Maintain 99.9% availability',
        'Respond in under 150ms',
        'Stay within $2,000/month budget',
        'Introduce microservices architecture',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 10000, daily: 100000 },
        performance: { latencyMs: 150, availability: 99.9 },
        budget: 2000,
        growth: '5x in 6 months',
        required: ['client', 'loadbalancer', 'server', 'database', 'cache'],
        bonus: [
          { component: 'queue', xp: 40, label: 'Add message queue (+40 XP)' },
          { component: 'monitoring', xp: 30, label: 'Add monitoring (+30 XP)' },
          { component: 'cdn', xp: 25, label: 'Add CDN (+25 XP)' },
        ],
      }),
      components: scalingComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Horizontal scaling handles traffic spikes effectively',
          'Database replicas improve read performance',
          'Message queues enable async processing',
        ],
        nextMission: 'global-expansion',
        nextPreview: 'Series B secured! Time to go global across 3 continents.',
      }),
    },
  });

  // ── Mission 3: Global Expansion ───────────────────────────────────────────
  const globalComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn'],
    hints: [
      'Add a CDN so edge nodes serve static content near your users across all 3 continents',
      'Add a Cache in each region to avoid cross-continent database round-trips',
      'Add an API Gateway to intelligently route requests to the nearest healthy server',
      'Add Monitoring to detect regional failures and trigger automated recovery',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'global-expansion' },
    update: { components: globalComponents },
    create: {
      slug: 'global-expansion',
      title: 'Mission 3: Global Expansion',
      difficulty: 3,
      estimatedTime: '30-45 min',
      xpReward: 500,
      order: 3,
      description: 'Series B secured! Serve users across 3 continents with consistent sub-100ms performance.',
      scenario: "Your startup just secured Series B funding! Time to go global. You need to serve users across 3 continents with consistent performance and near-zero downtime.",
      objectives: JSON.stringify([
        'Multi-region deployment across 3 continents',
        'Maintain 99.99% availability',
        'Achieve sub-100ms global response time',
        'Optimize cost for global infrastructure',
        'Implement disaster recovery',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 100000, daily: 1000000 },
        performance: { latencyMs: 100, availability: 99.99 },
        budget: 10000,
        growth: 'global',
        required: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn'],
        bonus: [
          { component: 'queue', xp: 50, label: 'Add global queue (+50 XP)' },
          { component: 'storage', xp: 40, label: 'Add distributed storage (+40 XP)' },
          { component: 'monitoring', xp: 35, label: 'Add global monitoring (+35 XP)' },
        ],
      }),
      components: globalComponents,
      feedbackData: JSON.stringify({
        learned: [
          'CDN reduces latency for global users dramatically',
          'Multi-region deployments improve availability and compliance',
          'Distributed databases balance consistency and performance',
        ],
        nextMission: 'file-converter',
        nextPreview: "Global architect achieved! Now build a real-world file conversion service.",
      }),
    },
  });

  // ── Mission 4: File Converter (like Zamzar) ────────────────────────────────
  const fileConverterComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'storage', 'database'],
    hints: [
      'Connect Client → API Gateway → Load Balancer → App Server for the upload path',
      'Add a Queue so file conversion jobs are processed asynchronously — never block the API',
      'Connect App Server → Queue → Storage to store both original and converted files',
      'Add Monitoring to detect failed conversion jobs early',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'file-converter' },
    update: { components: fileConverterComponents },
    create: {
      slug: 'file-converter',
      title: 'Mission 4: File Converter',
      difficulty: 2,
      estimatedTime: '20-25 min',
      xpReward: 400,
      order: 4,
      description: 'Build an async file conversion service that handles multiple file formats without blocking users.',
      scenario: "You're building a file conversion service like Zamzar. Users upload files and get converted versions (PDF→DOCX, JPG→PNG). The service must handle conversion asynchronously so users aren't blocked waiting for long-running jobs.",
      objectives: JSON.stringify([
        'Handle 5,000 concurrent upload requests',
        'Maintain 99% availability',
        'API response under 280ms',
        'Stay within $800/month budget',
        'Process conversions asynchronously via queues',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 5000, daily: 50000 },
        performance: { latencyMs: 280, availability: 99.0 },
        budget: 800,
        growth: '3x in 6 months',
        required: ['client', 'server', 'queue', 'storage', 'database'],
        bonus: [
          { component: 'monitoring', xp: 25, label: 'Add monitoring (+25 XP)' },
          { component: 'apigateway', xp: 35, label: 'Add API Gateway (+35 XP)' },
          { component: 'loadbalancer', xp: 40, label: 'Add Load Balancer (+40 XP)' },
        ],
      }),
      components: fileConverterComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Message queues decouple upload ingestion from file processing workers',
          'Object storage is ideal for large binary files — never store files in the DB',
          'Async architecture returns fast API responses while jobs run in the background',
        ],
        nextMission: 'url-shortener',
        nextPreview: 'File converter shipped! Now build a URL shortener at massive read scale.',
      }),
    },
  });

  // ── Mission 5: URL Shortener (like Bitly) ─────────────────────────────────
  const urlShortenerComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'cache'],
    hints: [
      'A Cache is critical — 99% of redirects can be served without touching the database',
      'Add a Load Balancer and multiple servers to handle 50k concurrent redirect requests',
      'CDN serves landing pages and short-link previews at edge nodes globally',
      'API Gateway protects your service from URL-flooding and scraping abuse',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'url-shortener' },
    update: { components: urlShortenerComponents },
    create: {
      slug: 'url-shortener',
      title: 'Mission 5: URL Shortener',
      difficulty: 3,
      estimatedTime: '20-25 min',
      xpReward: 500,
      order: 5,
      description: 'Design a high-throughput URL shortening service that resolves short links with minimal latency.',
      scenario: "You're building a URL shortener like Bitly. Users create short links once, but millions resolve them daily. The system is read-heavy — 99% reads, 1% writes. Every millisecond of redirect latency costs clicks and conversions.",
      objectives: JSON.stringify([
        'Handle 50,000 concurrent redirect requests',
        'Maintain 99.9% availability',
        'Resolve URLs in under 170ms',
        'Stay within $1,500/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 50000, daily: 500000 },
        performance: { latencyMs: 170, availability: 99.9 },
        budget: 1500,
        growth: '10x in 12 months',
        required: ['client', 'server', 'database', 'cache'],
        bonus: [
          { component: 'cdn', xp: 40, label: 'Add CDN for landing pages (+40 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add monitoring (+25 XP)' },
          { component: 'apigateway', xp: 30, label: 'Add API Gateway (+30 XP)' },
        ],
      }),
      components: urlShortenerComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Read-heavy systems benefit most from aggressive caching at every layer',
          'Cache-aside pattern for URL lookups reduces database load by up to 99%',
          'CDN edge nodes reduce redirect latency and origin server pressure globally',
        ],
        nextMission: 'live-scoreboard',
        nextPreview: '50,000 concurrent users handled. Now serve 80,000 live sports fans!',
      }),
    },
  });

  // ── Mission 6: Live Scoreboard (like CricBuzz) ────────────────────────────
  const liveScoreboardComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'cache', 'database'],
    hints: [
      'A Queue (pub/sub) broadcasts score-update events to all connected app servers simultaneously',
      'Cache stores the latest score — 80k concurrent viewers read from cache, not the database',
      'CDN serves match preview images, player photos, and static assets at the edge',
      'Load Balancer + 4 App Servers handles the 80k concurrent fan spike during the match',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'live-scoreboard' },
    update: { components: liveScoreboardComponents },
    create: {
      slug: 'live-scoreboard',
      title: 'Mission 6: Live Scoreboard',
      difficulty: 3,
      estimatedTime: '25-30 min',
      xpReward: 600,
      order: 6,
      description: 'Design a real-time sports scoring system that pushes live score updates to millions of fans without polling.',
      scenario: "You're architecting a live scoreboard like CricBuzz for a World Cup final with 80,000 concurrent viewers. Scores update every ball. Your system must push events in real time — polling the database on every request will immediately bring the system down.",
      objectives: JSON.stringify([
        'Handle 80,000 concurrent viewers',
        'Maintain 99.9% availability',
        'Push score updates under 150ms',
        'Stay within $3,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 80000, daily: 1000000 },
        performance: { latencyMs: 150, availability: 99.9 },
        budget: 3000,
        growth: 'spiky — 10x peaks during finals',
        required: ['client', 'server', 'queue', 'cache', 'database'],
        bonus: [
          { component: 'cdn', xp: 40, label: 'Add CDN for static assets (+40 XP)' },
          { component: 'apigateway', xp: 30, label: 'Add API Gateway (+30 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add monitoring (+25 XP)' },
        ],
      }),
      components: liveScoreboardComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Message queues act as pub/sub brokers to broadcast real-time score events',
          'Cache is critical for read-heavy dashboards — database must never be polled per viewer',
          'Horizontal scaling with multiple servers handles unpredictable traffic spikes',
        ],
        nextMission: 'code-judge',
        nextPreview: '80,000 fans handled seamlessly. Now build an isolated code execution engine!',
      }),
    },
  });

  // ── Mission 7: Code Judge (like Codeforces) ────────────────────────────────
  const codeJudgeComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'storage', 'database'],
    hints: [
      'Queue decouples submission ingestion from code execution — the API returns immediately',
      'Storage holds submitted source files, test case inputs, and expected output files',
      'Multiple App Servers act as isolated execution workers behind the Load Balancer',
      'Monitoring detects runaway execution jobs, memory leaks, and resource abuse',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'code-judge' },
    update: { components: codeJudgeComponents },
    create: {
      slug: 'code-judge',
      title: 'Mission 7: Code Judge',
      difficulty: 4,
      estimatedTime: '25-30 min',
      xpReward: 450,
      order: 7,
      description: 'Design an online judge system that safely executes user-submitted code in isolated worker environments.',
      scenario: "You're building an online judge like Codeforces. Users submit code that must be compiled and run in isolated sandboxes, compared against test cases, and returned with verdicts. Code execution is resource-intensive, unpredictable, and potentially malicious.",
      objectives: JSON.stringify([
        'Handle 2,000 concurrent code submissions',
        'Maintain 99.5% availability',
        'API response under 280ms (verdicts are async)',
        'Stay within $2,500/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 2000, daily: 20000 },
        performance: { latencyMs: 280, availability: 99.5 },
        budget: 2500,
        growth: '5x during programming competitions',
        required: ['client', 'server', 'queue', 'storage', 'database'],
        bonus: [
          { component: 'monitoring', xp: 35, label: 'Add monitoring (+35 XP)' },
          { component: 'apigateway', xp: 30, label: 'Add API Gateway (+30 XP)' },
          { component: 'loadbalancer', xp: 40, label: 'Add Load Balancer (+40 XP)' },
        ],
      }),
      components: codeJudgeComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Worker queue pattern isolates resource-heavy execution from the API response path',
          'Object storage safely persists job inputs, outputs, and execution artifacts',
          'Queue depth monitoring prevents submission backlogs during contest traffic spikes',
        ],
        nextMission: 'search-engine',
        nextPreview: 'Code judge operational! Now tackle distributed search at massive scale.',
      }),
    },
  });

  // ── Mission 8: Search Engine ────────────────────────────────────────────────
  const searchEngineComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'cache', 'storage'],
    hints: [
      'Cache stores results for popular queries — the same searches repeat millions of times daily',
      'Queue handles async indexing so new document writes do not slow down search reads',
      'Storage holds the raw document corpus, index snapshots, and crawl data',
      'CDN serves autocomplete suggestions and the static search UI from edge nodes',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'search-engine' },
    update: { components: searchEngineComponents },
    create: {
      slug: 'search-engine',
      title: 'Mission 8: Search Engine',
      difficulty: 4,
      estimatedTime: '30-35 min',
      xpReward: 650,
      order: 8,
      description: 'Design a full-text search system that indexes millions of documents and returns ranked results in milliseconds.',
      scenario: "You're building the search infrastructure for a product catalog with 50 million items. Users expect instant, relevant results. Search indexing happens asynchronously, but reads must be served with sub-160ms latency during peak traffic of 75,000 concurrent queries.",
      objectives: JSON.stringify([
        'Handle 75,000 concurrent search queries',
        'Maintain 99.9% availability',
        'Return search results under 160ms',
        'Stay within $5,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 75000, daily: 750000 },
        performance: { latencyMs: 160, availability: 99.9 },
        budget: 5000,
        growth: '20% per quarter',
        required: ['client', 'server', 'database', 'cache', 'storage'],
        bonus: [
          { component: 'cdn', xp: 35, label: 'Add CDN for search UI (+35 XP)' },
          { component: 'queue', xp: 40, label: 'Add async indexing queue (+40 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add monitoring (+25 XP)' },
        ],
      }),
      components: searchEngineComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Inverted index structures enable fast full-text search across millions of documents',
          'Async indexing via queues decouples write-heavy indexing from read-heavy search',
          'Caching top queries eliminates repeated expensive index traversals',
        ],
        nextMission: 'booking-system',
        nextPreview: 'Search mastered! Now handle complex bookings with concurrency control.',
      }),
    },
  });

  // ── Mission 9: Booking System (like Airbnb) ────────────────────────────────
  const bookingSystemComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'cache', 'queue'],
    hints: [
      'Cache holds distributed availability locks — prevents two users booking the same property',
      'Queue serializes concurrent booking requests for the same property (eliminates race conditions)',
      'Load Balancer + 3 App Servers handle booking bursts without request timeouts',
      'API Gateway rate-limits automated booking bots that attempt to lock inventory',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'booking-system' },
    update: { components: bookingSystemComponents },
    create: {
      slug: 'booking-system',
      title: 'Mission 9: Booking System',
      difficulty: 4,
      estimatedTime: '30-35 min',
      xpReward: 550,
      order: 9,
      description: 'Design a reservation system that prevents double-bookings under high concurrent demand using distributed locking.',
      scenario: "You're architecting the booking backend for a property rental platform like Airbnb. The hardest problem: two users booking the same property at the exact same time. Your system must guarantee exactly-once reservations through distributed locks and ACID transactions.",
      objectives: JSON.stringify([
        'Handle 10,000 concurrent booking requests',
        'Maintain 99.9% availability',
        'Confirm bookings under 200ms',
        'Stay within $3,500/month budget',
        'Prevent double-booking race conditions',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 10000, daily: 100000 },
        performance: { latencyMs: 200, availability: 99.9 },
        budget: 3500,
        growth: 'seasonal spikes (3x during holidays)',
        required: ['client', 'server', 'database', 'cache', 'queue'],
        bonus: [
          { component: 'apigateway', xp: 35, label: 'Add API Gateway (+35 XP)' },
          { component: 'monitoring', xp: 30, label: 'Add monitoring (+30 XP)' },
          { component: 'storage', xp: 20, label: 'Add storage for booking receipts (+20 XP)' },
        ],
      }),
      components: bookingSystemComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Cache-based distributed locks prevent race conditions in concurrent reservations',
          'ACID transactions in the database guarantee atomic booking creation',
          'Queue serialization prevents thundering-herd double-booking during flash sales',
        ],
        nextMission: 'social-feed',
        nextPreview: 'Concurrency conquered! Now design a social feed for 500,000 users.',
      }),
    },
  });

  // ── Mission 10: Social Feed (like Twitter) ─────────────────────────────────
  const socialFeedComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'cache', 'queue'],
    hints: [
      'Queue broadcasts post events to follower feed-builder workers (fan-out on write pattern)',
      'Cache stores pre-computed timelines — reading feeds must NEVER hit the database directly',
      'Storage holds images and videos — media always flows through object storage + CDN',
      'API Gateway protects against API abuse from third-party clients and bots',
      '4 App Servers behind the Load Balancer are needed to handle 500k concurrent readers',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'social-feed' },
    update: { components: socialFeedComponents },
    create: {
      slug: 'social-feed',
      title: 'Mission 10: Social Feed',
      difficulty: 5,
      estimatedTime: '35-45 min',
      xpReward: 900,
      order: 10,
      description: 'Design a social media feed system that generates personalized timelines for hundreds of thousands of users.',
      scenario: "You're building the feed infrastructure for a social platform at Twitter-scale. When a celebrity with 10M followers posts, the system must fan out that post to millions of timelines instantly. Speed and freshness both matter — users expect their feed in under 200ms.",
      objectives: JSON.stringify([
        'Handle 500,000 concurrent feed readers',
        'Maintain 99.99% availability',
        'Load timelines under 160ms',
        'Stay within $15,000/month budget',
        'Support fan-out delivery for posts to followers',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 500000, daily: 5000000 },
        performance: { latencyMs: 160, availability: 99.99 },
        budget: 15000,
        growth: 'viral — unpredictable 100x spikes',
        required: ['client', 'server', 'database', 'cache', 'queue'],
        bonus: [
          { component: 'cdn', xp: 40, label: 'Add CDN for media delivery (+40 XP)' },
          { component: 'storage', xp: 35, label: 'Add object storage for media (+35 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add monitoring (+25 XP)' },
        ],
      }),
      components: socialFeedComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Fan-out on write pre-computes feeds for fast reads at massive scale',
          'Cache is the primary read store for timelines — database is source of truth only',
          'CDN + object storage offload all media delivery entirely from app servers',
        ],
        nextMission: 'ride-hailing',
        nextPreview: '500,000 users handled! Now match drivers to riders in real time.',
      }),
    },
  });

  // ── Mission 11: Ride Hailing (like Uber) ──────────────────────────────────
  const rideHailingComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'cache', 'queue'],
    hints: [
      'Cache stores live driver locations updated every 3 seconds — DB reads are too slow for geo-matching',
      'Queue decouples ride-request events from the matching algorithm workers',
      'CDN serves map tiles from edge nodes — maps must load instantly for riders',
      'API Gateway handles WebSocket connections for real-time driver location streaming',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'ride-hailing' },
    update: { components: rideHailingComponents },
    create: {
      slug: 'ride-hailing',
      title: 'Mission 11: Ride Hailing',
      difficulty: 5,
      estimatedTime: '35-40 min',
      xpReward: 700,
      order: 11,
      description: 'Design a real-time ride matching system that connects drivers and riders with sub-second responses.',
      scenario: "You're architecting the core matching engine for a ride-hailing platform like Uber. Drivers broadcast their GPS location every 3 seconds. Riders request rides and must be matched to the nearest available driver within 155ms. Every delay means lost rides.",
      objectives: JSON.stringify([
        'Handle 25,000 concurrent ride requests',
        'Maintain 99.9% availability',
        'Match drivers in under 155ms',
        'Stay within $8,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 25000, daily: 250000 },
        performance: { latencyMs: 155, availability: 99.9 },
        budget: 8000,
        growth: '4x peak demand during rush hours',
        required: ['client', 'server', 'database', 'cache', 'queue'],
        bonus: [
          { component: 'cdn', xp: 30, label: 'Add CDN for map tiles (+30 XP)' },
          { component: 'apigateway', xp: 35, label: 'Add API Gateway (+35 XP)' },
          { component: 'monitoring', xp: 30, label: 'Add monitoring (+30 XP)' },
        ],
      }),
      components: rideHailingComponents,
      feedbackData: JSON.stringify({
        learned: [
          'In-memory geo-indexes in cache power sub-second driver proximity queries',
          'Event-driven matching via queues scales elastically with demand spikes',
          'CDN is essential for map tile delivery at global scale',
        ],
        nextMission: 'video-streaming',
        nextPreview: 'Ride matching mastered! Now stream video to 500,000 concurrent viewers.',
      }),
    },
  });

  // ── Mission 12: Video Streaming (like Netflix) ────────────────────────────
  const videoStreamingComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'cdn', 'storage', 'database'],
    hints: [
      'CDN is the backbone — video bytes must NEVER travel from origin on every play request',
      'Queue handles async video transcoding jobs (multiple resolutions: 480p, 720p, 1080p, 4K)',
      'Storage holds the entire video corpus — terabytes of encoded content per title',
      'Cache stores video metadata, watch history, and personalised recommendations',
      '4 App Servers behind the Load Balancer manage 500k concurrent streaming sessions',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'video-streaming' },
    update: { components: videoStreamingComponents },
    create: {
      slug: 'video-streaming',
      title: 'Mission 12: Video Streaming',
      difficulty: 5,
      estimatedTime: '40-50 min',
      xpReward: 1000,
      order: 12,
      description: 'Design a video streaming platform that encodes and delivers content to hundreds of thousands of concurrent viewers.',
      scenario: "You're building the video infrastructure for a streaming platform like Netflix. Videos must be encoded into multiple formats and bitrates after upload, then served globally via CDN. A popular show launch triggers 500,000 simultaneous streams — your origin servers cannot handle this directly.",
      objectives: JSON.stringify([
        'Serve 500,000 concurrent video streams',
        'Maintain 99.99% availability',
        'Stream initiation under 160ms',
        'Stay within $50,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 500000, daily: 5000000 },
        performance: { latencyMs: 160, availability: 99.99 },
        budget: 50000,
        growth: 'catalog grows 10% monthly',
        required: ['client', 'server', 'cdn', 'storage', 'database'],
        bonus: [
          { component: 'queue', xp: 45, label: 'Add encoding queue (+45 XP)' },
          { component: 'cache', xp: 35, label: 'Add metadata cache (+35 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add monitoring (+25 XP)' },
        ],
      }),
      components: videoStreamingComponents,
      feedbackData: JSON.stringify({
        learned: [
          'CDN edge delivery is mandatory for video — origin servers cannot serve at this scale',
          'Async transcoding queues handle multi-format encoding without blocking video uploads',
          'Cache makes video metadata, thumbnails, and watch progress blazing fast to retrieve',
        ],
        nextMission: 'payment-processing',
        nextPreview: '500,000 streams! Final mission: build a bulletproof payment processing system.',
      }),
    },
  });

  // ── Mission 13: Payment Processing (like Stripe) ──────────────────────────
  const paymentComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'queue', 'monitoring'],
    hints: [
      'Monitoring is REQUIRED — every payment failure must trigger an immediate alert',
      'Queue ensures payment events are processed exactly once via idempotency keys',
      'Load Balancer + 3 App Servers handle 5k concurrent requests with zero SPOFs',
      'API Gateway enforces authentication and rate limits on all payment endpoints',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'payment-processing' },
    update: { components: paymentComponents },
    create: {
      slug: 'payment-processing',
      title: 'Mission 13: Payment Processing',
      difficulty: 5,
      estimatedTime: '35-45 min',
      xpReward: 800,
      order: 13,
      description: 'Design a payment processing system with idempotent transactions, fraud detection, and financial-grade reliability.',
      scenario: "You're building the payment infrastructure for a fintech platform like Stripe. Every transaction must be processed exactly once — no double charges, no lost payments. The system handles 5,000 concurrent payment requests with strict audit and compliance requirements.",
      objectives: JSON.stringify([
        'Handle 5,000 concurrent payment requests',
        'Maintain 99% availability',
        'Process payments under 280ms',
        'Stay within $5,000/month budget',
        'Guarantee idempotent transaction processing',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 5000, daily: 50000 },
        performance: { latencyMs: 280, availability: 99.0 },
        budget: 5000,
        growth: 'doubles every quarter',
        required: ['client', 'server', 'database', 'queue', 'monitoring'],
        bonus: [
          { component: 'apigateway', xp: 45, label: 'Add API Gateway for auth (+45 XP)' },
          { component: 'loadbalancer', xp: 35, label: 'Add Load Balancer (+35 XP)' },
          { component: 'cache', xp: 30, label: 'Add idempotency key cache (+30 XP)' },
        ],
      }),
      components: paymentComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Idempotency keys stored in a queue guarantee exactly-once payment processing',
          'Monitoring and audit logs are regulatory requirements for all payment systems',
          'ACID database transactions prevent partial or inconsistent payment states',
        ],
        nextMission: null,
        nextPreview: "You've completed all 13 missions — you are a System Design Master! 🏆",
      }),
    },
  });

  console.log('✅ Seed complete! 13 missions loaded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
