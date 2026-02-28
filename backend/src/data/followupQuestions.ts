// Follow-up question bank for Interview Simulation Mode (F-006)
// Questions are injected at ~50% elapsed time to simulate real FAANG interviewer probing.

export interface FollowupQuestion {
  id: string;
  question: string;
  /** What dimension this question probes */
  dimension: 'scalability' | 'reliability' | 'tradeoffs' | 'deep-dive' | 'edge-cases';
}

export const FOLLOWUP_QUESTIONS: Record<string, FollowupQuestion[]> = {
  'mvp-launch': [
    { id: 'mvp-1', question: 'Your MVP just went viral — traffic spiked 100x overnight. Walk me through what breaks first and how you\'d handle it.', dimension: 'scalability' },
    { id: 'mvp-2', question: 'The database is now the bottleneck. What are your options beyond vertical scaling?', dimension: 'deep-dive' },
    { id: 'mvp-3', question: 'A deployment at 2am corrupts user data. What\'s your recovery plan?', dimension: 'reliability' },
  ],
  'scaling-up': [
    { id: 'scale-1', question: 'Your cache hit rate dropped from 95% to 40% after a schema change. What happened and how do you fix it?', dimension: 'deep-dive' },
    { id: 'scale-2', question: 'Two servers are returning different data for the same user. What\'s causing this and how do you prevent it?', dimension: 'reliability' },
    { id: 'scale-3', question: 'You need to add a new feature that requires a slow database migration on a live system. What\'s your approach?', dimension: 'edge-cases' },
  ],
  'global-expansion': [
    { id: 'global-1', question: 'A region goes down. How does your system behave, and how do you route traffic automatically?', dimension: 'reliability' },
    { id: 'global-2', question: 'GDPR requires EU user data stays in EU. How does this change your architecture?', dimension: 'tradeoffs' },
    { id: 'global-3', question: 'Your CDN is serving stale data after a content update. Walk me through your cache invalidation strategy.', dimension: 'deep-dive' },
  ],
  'file-converter': [
    { id: 'fc-1', question: 'A conversion job is stuck running for 3 hours. How do you detect, kill, and retry it?', dimension: 'reliability' },
    { id: 'fc-2', question: 'Queue depth is growing faster than workers can process. How do you scale workers dynamically?', dimension: 'scalability' },
    { id: 'fc-3', question: 'A user uploads a 10GB file. Walk me through what happens differently vs a 1MB file.', dimension: 'edge-cases' },
  ],
  'url-shortener': [
    { id: 'url-1', question: 'Your cache just cold-started after a reboot. How do you prevent a thundering herd of DB reads?', dimension: 'reliability' },
    { id: 'url-2', question: 'A brand requests a custom vanity URL (e.g. go.company.com/product). How does this change your design?', dimension: 'deep-dive' },
    { id: 'url-3', question: 'How do you handle 301 vs 302 redirects and what are the caching implications?', dimension: 'tradeoffs' },
  ],
  'live-scoreboard': [
    { id: 'ls-1', question: '80,000 users are connected via WebSocket. The score server crashes. What happens and how do you recover connections?', dimension: 'reliability' },
    { id: 'ls-2', question: 'A score update arrives out of order (network reordering). How do you ensure clients show the correct latest score?', dimension: 'edge-cases' },
    { id: 'ls-3', question: 'A celebrity tweets about the match and concurrent users spike from 80k to 800k in 30 seconds. What auto-scales?', dimension: 'scalability' },
  ],
  'code-judge': [
    { id: 'cj-1', question: 'A submitted program enters an infinite loop. How does your system detect and kill it?', dimension: 'reliability' },
    { id: 'cj-2', question: 'During a contest, 5,000 users submit simultaneously. Walk me through your queue strategy to handle this.', dimension: 'scalability' },
    { id: 'cj-3', question: 'A user submits code that tries to read /etc/passwd. How do you prevent this at the infrastructure level?', dimension: 'deep-dive' },
  ],
  'search-engine': [
    { id: 'se-1', question: 'A new product is added but doesn\'t appear in search for 2 minutes. How do you reduce this indexing lag?', dimension: 'deep-dive' },
    { id: 'se-2', question: '"iPhone" returns worse results than "iphone". How do you handle case normalization and tokenization?', dimension: 'edge-cases' },
    { id: 'se-3', question: 'Top 1% of queries account for 60% of traffic. How does caching popular queries change your architecture?', dimension: 'scalability' },
  ],
  'booking-system': [
    { id: 'bs-1', question: 'Your distributed lock expires while a user is still on the checkout page. What happens?', dimension: 'edge-cases' },
    { id: 'bs-2', question: 'A third-party payment gateway call during booking times out. Do you release the lock or hold it?', dimension: 'tradeoffs' },
    { id: 'bs-3', question: 'How do you handle overbooking if two processes both pass the availability check before either writes?', dimension: 'reliability' },
  ],
  'social-feed': [
    { id: 'sf-1', question: 'A celebrity with 50M followers posts. Your fan-out queue has 50M tasks. How long does it take and what do you do differently for them?', dimension: 'scalability' },
    { id: 'sf-2', question: 'A user unfollows someone — should you remove their posts from the existing cached timeline? Why or why not?', dimension: 'tradeoffs' },
    { id: 'sf-3', question: 'Your timeline cache evicts 30% of entries due to memory pressure. What does the user experience look like?', dimension: 'reliability' },
  ],
  'ride-hailing': [
    { id: 'rh-1', question: 'GPS updates arrive every 3 seconds. How do you handle a driver with spotty connectivity dropping updates?', dimension: 'edge-cases' },
    { id: 'rh-2', question: 'It\'s New Year\'s Eve — 10x normal demand, driver supply hasn\'t scaled. How does your matching algorithm degrade gracefully?', dimension: 'reliability' },
    { id: 'rh-3', question: 'Two drivers are equidistant from a rider and both get matched. How do you prevent both from accepting?', dimension: 'deep-dive' },
  ],
  'video-streaming': [
    { id: 'vs-1', question: 'A popular show launches and 500k users hit play simultaneously. Your CDN origin is overwhelmed. What went wrong?', dimension: 'reliability' },
    { id: 'vs-2', question: 'A user is watching a video and their bandwidth drops from 10Mbps to 1Mbps. How does adaptive bitrate streaming handle this?', dimension: 'deep-dive' },
    { id: 'vs-3', question: 'A newly uploaded video needs to be available in 5 minutes globally. Walk through your transcoding pipeline timing.', dimension: 'scalability' },
  ],
  'payment-processing': [
    { id: 'pp-1', question: 'A payment request times out at the network level — you don\'t know if the charge succeeded. How do you handle this?', dimension: 'edge-cases' },
    { id: 'pp-2', question: 'Your idempotency key store (cache) crashes. How do you prevent duplicate charges during recovery?', dimension: 'reliability' },
    { id: 'pp-3', question: 'PCI-DSS compliance requires all cardholder data to be encrypted at rest and in transit. How does this change your architecture?', dimension: 'deep-dive' },
  ],
};

/** Pick one follow-up question for a session (at 50% elapsed) */
export function pickFollowupQuestion(missionSlug: string): FollowupQuestion | null {
  const questions = FOLLOWUP_QUESTIONS[missionSlug];
  if (!questions || questions.length === 0) return null;
  // Pick randomly for variety
  return questions[Math.floor(Math.random() * questions.length)];
}
