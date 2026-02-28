/**
 * followupQuestions-sprint3.ts
 * Sprint 3 interview follow-up questions — missions 26-40 AND concept-depth missions 41-48
 * Append entries into FOLLOWUP_QUESTIONS in followupQuestions.ts
 */
import { FollowupQuestion } from './followupQuestions';

export const SPRINT3_FOLLOWUP_QUESTIONS: Record<string, FollowupQuestion[]> = {
  // ── Missions 26–40 ───────────────────────────────────────────────────────
  'shard-or-die': [
    { id: 'sod-1', question: 'User ID 1,500,000,001 is in shard 3. A celebrity posts and 500M users hit their profile simultaneously — all landing on shard 3. How do you handle this hotspot?', dimension: 'scalability' },
    { id: 'sod-2', question: 'You need to add a 4th shard. How do you migrate existing data without taking the system offline or causing data loss?', dimension: 'deep-dive' },
    { id: 'sod-3', question: 'A cross-shard query needs to join users from shard 1 and posts from shard 2. What are your options and what are the trade-offs?', dimension: 'tradeoffs' },
  ],
  'youtube-deep-read': [
    { id: 'ydr-1', question: 'A new video goes viral — CDN has zero cached copies. 2M users hit play simultaneously. Walk me through what happens at the origin and how you prevent it from melting.', dimension: 'scalability' },
    { id: 'ydr-2', question: 'Transcoding a 4K 2-hour video takes 8 hours. A creator uploads it and expects it live in 5 minutes. How do you reconcile this?', dimension: 'tradeoffs' },
    { id: 'ydr-3', question: 'YouTube shows "1.2M views" but the actual count differs by ±50K. Walk me through how you implement eventually-consistent view counting at this scale.', dimension: 'deep-dive' },
  ],
  'how-bluesky-works': [
    { id: 'bsky-1', question: 'A user wants to migrate from PDS-A to PDS-B without losing followers or history. Walk me through the migration process in the AT Protocol.', dimension: 'deep-dive' },
    { id: 'bsky-2', question: 'The global Relay Firehose goes down for 2 minutes. What does a user on PDS-A see when viewing posts from PDS-B during the outage?', dimension: 'reliability' },
    { id: 'bsky-3', question: 'A malicious PDS starts publishing spam events at 10,000/second into the Firehose. How does the AppView protect itself?', dimension: 'edge-cases' },
  ],
  'sports-leaderboard': [
    { id: 'sl-1', question: '5M WebSocket connections are open. The match ends. How do you gracefully close all connections without a thundering herd on reconnect?', dimension: 'edge-cases' },
    { id: 'sl-2', question: 'The score API goes down for 45 seconds mid-match. When it comes back, 5M clients reconnect simultaneously. What is your reconnection strategy?', dimension: 'reliability' },
    { id: 'sl-3', question: 'A goal is scored. The score update takes 200ms to reach clients but TV commentary reaches viewers in 50ms. How do you solve the discrepancy?', dimension: 'tradeoffs' },
  ],
  'circuit-breaker': [
    { id: 'cb-1', question: 'Your circuit breaker opened on the inventory service. The fallback returns "stock: available" for everything. A user buys the last item — but inventory was 0. What happened and how do you fix it?', dimension: 'edge-cases' },
    { id: 'cb-2', question: 'The circuit is HALF-OPEN and the probe request fails. How long do you keep the circuit OPEN before trying again? What algorithm do you use?', dimension: 'deep-dive' },
    { id: 'cb-3', question: 'You have 12 microservices. Each adds circuit breaker overhead. What is the total latency impact on a request that touches 5 services in sequence?', dimension: 'tradeoffs' },
  ],
  'notification-engine': [
    { id: 'ne-1', question: 'The email provider rate-limits you at 100 sends/second. Your queue has 5M messages. How long will it take to drain and how do you tell users when to expect their notification?', dimension: 'scalability' },
    { id: 'ne-2', question: 'A user unsubscribes from email while their notification is in the queue. The worker processes it 10 seconds later and sends the email anyway. How do you prevent this?', dimension: 'edge-cases' },
    { id: 'ne-3', question: 'Your DLQ has 10,000 messages after an APNS outage. The outage recovers. How do you drain the DLQ without overwhelming APNS again?', dimension: 'reliability' },
  ],
  'rest-vs-graphql': [
    { id: 'gql-1', question: 'A mobile developer writes a GraphQL query that fetches 50 nested levels of data. How do you prevent abuse of deeply nested queries?', dimension: 'edge-cases' },
    { id: 'gql-2', question: 'You need to cache a GraphQL response at the CDN level. GraphQL uses POST requests — CDN does not cache POST. How do you solve this?', dimension: 'deep-dive' },
    { id: 'gql-3', question: 'Your GraphQL API is used by iOS, Android, and Web clients that each need slightly different fields. How does this change your schema design vs REST?', dimension: 'tradeoffs' },
  ],
  'event-driven-microservice': [
    { id: 'edm-1', question: 'Payment succeeded but the PaymentCharged event was published twice. Shipping creates 2 labels. How do you make the Shipping service idempotent?', dimension: 'reliability' },
    { id: 'edm-2', question: 'The Inventory service is down when OrderPlaced is published. The order is in limbo. How does your system handle this and how does the user find out?', dimension: 'edge-cases' },
    { id: 'edm-3', question: 'You need to query "all orders where payment succeeded and shipping was created". In a distributed event system, how do you answer this?', dimension: 'deep-dive' },
  ],
  'presence-at-scale': [
    { id: 'pas-1', question: 'Your Redis cluster for presence goes down. 500M user records are unavailable. What does the app show and how do you recover gracefully?', dimension: 'reliability' },
    { id: 'pas-2', question: 'A user opens the app on 3 devices simultaneously. How do you represent their presence — are they online if 1 of 3 devices loses connectivity?', dimension: 'edge-cases' },
    { id: 'pas-3', question: 'Privacy regulations require users to hide online status from specific contacts. How does this affect your fan-out architecture?', dimension: 'tradeoffs' },
  ],
  'multiplayer-game-server': [
    { id: 'mgs-1', question: 'A game server crashes mid-session with 10 players connected. You have the last Cache snapshot from 800ms ago. How do you resume and what do players experience?', dimension: 'reliability' },
    { id: 'mgs-2', question: 'One player has 300ms latency while others have 20ms. Your tick rate is 50ms. How do you keep the game fair without showing all players a lagged view?', dimension: 'deep-dive' },
    { id: 'mgs-3', question: 'A player exploits client-side prediction to teleport. Your server receives the input. How does the authoritative server model detect and reject this cheat?', dimension: 'edge-cases' },
  ],
  'observability-at-scale': [
    { id: 'obs-1', question: 'An engineer writes a query scanning 15 months of raw data across 50B data points. Your query engine is under heavy CPU load. How do you protect other queries?', dimension: 'edge-cases' },
    { id: 'obs-2', question: 'Your ingestion pipeline has 30 seconds of lag. An incident is happening NOW but alerts are 30 seconds behind. How do you reduce lag without 10x cost increase?', dimension: 'tradeoffs' },
    { id: 'obs-3', question: 'A customer sends 10M unique label combinations — a cardinality bomb. How does it affect your TSDB and how do you mitigate it?', dimension: 'deep-dive' },
  ],
  'distributed-locks-deep-dive': [
    { id: 'dll-1', question: 'A Redlock holder pauses 31 seconds due to GC stop-the-world. The lock expired. Another process acquired it. The first process resumes. What happens without fencing tokens?', dimension: 'edge-cases' },
    { id: 'dll-2', question: 'One of your 2 Redis nodes is 80ms slower. Half your lock acquisitions time out. How do you diagnose and recover without losing lock safety?', dimension: 'reliability' },
    { id: 'dll-3', question: 'Your lock TTL is 10s. A network partition isolates the holder for 11 seconds. What happens to the lock and the shared resource?', dimension: 'deep-dive' },
  ],
  'concurrency-vs-parallelism': [
    { id: 'cvp-1', question: 'Your I/O thread pool is saturated — all 1000 threads are blocked on slow DB reads. New requests time out. How do you diagnose this without increasing thread count?', dimension: 'deep-dive' },
    { id: 'cvp-2', question: 'A CPU-bound task is accidentally submitted to the I/O thread pool. It runs for 10 seconds and blocks 1000 concurrent I/O operations. How do you prevent this at the framework level?', dimension: 'edge-cases' },
    { id: 'cvp-3', question: 'You are running 8 CPU threads on a 4-core machine. Does this help or hurt throughput? When would you intentionally over-provision CPU threads?', dimension: 'tradeoffs' },
  ],
  'two-phase-commit-practice': [
    { id: 'tpc-1', question: 'The coordinator sends COMMIT to DB1 successfully but crashes before sending to DB2. DB1 is committed, DB2 is in PREPARED state with locks held. How does recovery work?', dimension: 'reliability' },
    { id: 'tpc-2', question: '2PC latency is 200ms across regions. Your payment SLA is 150ms. 2PC violates your SLA. What is the alternative and what consistency do you sacrifice?', dimension: 'tradeoffs' },
    { id: 'tpc-3', question: 'One of your 3 DB participants is a legacy system that does not support PREPARE. How do you still achieve atomicity?', dimension: 'deep-dive' },
  ],
  'full-stack-observability-capstone': [
    { id: 'cap-1', question: 'Your platform is at 99.99% uptime. A single DB node failure causes 10 minutes of downtime. Which architectural change has the highest impact on reducing downtime?', dimension: 'tradeoffs' },
    { id: 'cap-2', question: 'A CDN edge node in Singapore goes down. Walk me through how traffic reroutes, what users experience, and how long recovery takes.', dimension: 'reliability' },
    { id: 'cap-3', question: 'A security incident requires rotating all session tokens globally within 15 minutes for 500M users. Walk me through the architecture changes needed.', dimension: 'deep-dive' },
  ],

  // ── Concept-depth missions 41–48 ──────────────────────────────────────────────
  'secure-the-gates': [
    { id: 'stg-1', question: 'A user\'s refresh token is stolen by an XSS attack. The attacker refreshes every 5 minutes to keep issuing new tokens indefinitely. How do you detect and invalidate this session?', dimension: 'edge-cases' },
    { id: 'stg-2', question: 'Your API Gateway validates JWTs on every request using the public key. The private key is rotated. For 15 minutes both old and new tokens are valid. How do you handle the transition?', dimension: 'deep-dive' },
    { id: 'stg-3', question: 'You want to add MFA (TOTP). The user\'s TOTP app is on the same phone as the browser. Has MFA actually improved security? What would truly improve it?', dimension: 'tradeoffs' },
  ],
  'the-file-converter': [
    { id: 'tfc-1', question: 'A paid user\'s 5GB video conversion fails on attempt 3 and lands in the DLQ. The user emails support 6 hours later. How does your system give support the context to diagnose and retry the job?', dimension: 'reliability' },
    { id: 'tfc-2', question: 'You\'re storing both original and converted files. Storage costs are growing 30% month-over-month. How do you reduce costs without degrading the paid user experience?', dimension: 'tradeoffs' },
    { id: 'tfc-3', question: 'Two users upload the exact same 1GB file simultaneously. How do you detect the duplicate and avoid converting and storing it twice?', dimension: 'deep-dive' },
  ],
  'how-reddit-works': [
    { id: 'rdt-1', question: 'Your Redis batch writer crashes after updating the Cache but before flushing to the DB. Vote counts in Redis are ahead of the DB by 30 seconds of votes. How do you reconcile on restart?', dimension: 'reliability' },
    { id: 'rdt-2', question: 'A new subreddit launches and gets 10M posts in 1 hour. Your search index update queue has 10M pending items. Readers expect search to work immediately. How do you handle this?', dimension: 'scalability' },
    { id: 'rdt-3', question: 'Reddit\'s hot algorithm favors recency, but a years-old post keeps getting upvoted and appearing on the front page. How do you prevent this while keeping the algorithm simple?', dimension: 'tradeoffs' },
  ],
  'how-amazon-s3-works': [
    { id: 's3-1', question: 'An entire availability zone goes down. You have 3 replicas: one in the failed AZ, two in healthy AZs. A user requests an object whose primary replica was in the failed AZ. Walk me through what happens.', dimension: 'reliability' },
    { id: 's3-2', question: 'Your consistent hash ring has 100 storage nodes. You add 10 more. Which objects need to be migrated and how do you migrate them without downtime?', dimension: 'deep-dive' },
    { id: 's3-3', question: 'A multipart upload fails on part 47 of 1000. The user retries. How does the system resume from part 47 without re-uploading the first 46 parts?', dimension: 'edge-cases' },
  ],
  'change-data-capture': [
    { id: 'cdc-1', question: 'Your CDC connector falls behind by 2 hours due to a burst of batch inserts. The data warehouse is 2 hours stale. How do you catch up without overwhelming the message queue or the warehouse?', dimension: 'scalability' },
    { id: 'cdc-2', question: 'A developer drops a column from the production DB. The CDC event arrives at the warehouse consumer, which expects that column. What breaks and how do you design for safe schema evolution?', dimension: 'deep-dive' },
    { id: 'cdc-3', question: 'Your CDC uses a logical replication slot in Postgres. The slot is not consumed for 48 hours (consumer outage). What happens to the Postgres WAL and how do you recover?', dimension: 'reliability' },
  ],
  'the-saga-pattern': [
    { id: 'saga-1', question: 'The Payment service charged the customer but the PaymentCharged event was never published (network failure). The Orchestrator times out and sends a CompensatePayment command. Now the customer is refunded but was charged. How do you make payment charging idempotent?', dimension: 'edge-cases' },
    { id: 'saga-2', question: 'Your saga has 6 steps. Step 5 (shipping) fails after step 4 (order confirmed) succeeds. The compensating transaction for order confirmation sends a cancellation email. The customer already received the order confirmation. How do you handle this UX problem?', dimension: 'tradeoffs' },
    { id: 'saga-3', question: 'You have 1000 concurrent sagas in progress. The Event Bus goes down for 30 seconds. All 1000 sagas are frozen mid-execution. How do your services know to resume when the bus recovers?', dimension: 'reliability' },
  ],
  'service-mesh-microservices': [
    { id: 'sm-1', question: 'You deploy a new version of the auth service with a canary at 10%. After 5 minutes, the error rate for the 10% is 0.8% — your auto-rollback threshold is 1%. Do you continue rollout? What additional signals do you check?', dimension: 'tradeoffs' },
    { id: 'sm-2', question: 'Distributed tracing shows a 500ms latency spike every 60 seconds in service B, but only when called from service A. Service B is fine when called from other services. How do you investigate this?', dimension: 'deep-dive' },
    { id: 'sm-3', question: 'Your service mesh adds 2ms of overhead per service hop. A user request touches 8 services in sequence. How does this 16ms overhead affect your architecture decisions?', dimension: 'edge-cases' },
  ],
  'cqrs-event-sourcing': [
    { id: 'cqrs-1', question: 'An account has 10 million events over 10 years. Reconstructing the balance requires replaying all 10M events. Your read latency SLA is 50ms. How do you meet this SLA?', dimension: 'deep-dive' },
    { id: 'cqrs-2', question: 'A bug in the projection code caused incorrect balances for 10,000 accounts. You fix the bug. How do you rebuild the correct read model without taking the system offline?', dimension: 'reliability' },
    { id: 'cqrs-3', question: 'Regulators ask: "Show us every action taken on account #12345 between Jan 1 and Jan 31, 2023, including who approved each transaction." How does your Event Store make this query possible?', dimension: 'tradeoffs' },
  ],
};
