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

  // Seed Missions
  await prisma.mission.upsert({
    where: { slug: 'mvp-launch' },
    update: {},
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
      components: JSON.stringify({
        available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage'],
        required: ['client', 'server', 'database'],
        hints: [
          'Start with the basics: Client → Server → Database',
          'Load balancers prevent single points of failure',
          'Caching reduces database load significantly',
          'Monitor your budget in real-time',
        ],
      }),
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

  await prisma.mission.upsert({
    where: { slug: 'scaling-up' },
    update: {},
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
      components: JSON.stringify({
        available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
        required: ['client', 'loadbalancer', 'server', 'database', 'cache'],
        hints: [
          'Multiple servers behind a load balancer handle more traffic',
          'A read replica reduces database load',
          'Message queues decouple heavy processing',
          'Monitor performance proactively',
        ],
      }),
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

  await prisma.mission.upsert({
    where: { slug: 'global-expansion' },
    update: {},
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
      components: JSON.stringify({
        available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
        required: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn'],
        hints: [
          'CDN edge nodes serve static content near users globally',
          'Database replication across regions reduces latency',
          'Global load balancers route to nearest data center',
          'Disaster recovery ensures business continuity',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'CDN reduces latency for global users dramatically',
          'Multi-region deployments improve availability and compliance',
          'Distributed databases balance consistency and performance',
        ],
        nextMission: null,
        nextPreview: "You've mastered system architecture! You're a Global Architect.",
      }),
    },
  });

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
