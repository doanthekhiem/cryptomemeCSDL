# COMPONENT VIEW - CryptoMeme.org

Tài liệu này mô tả kiến trúc tổng quan và các thành phần của hệ sinh thái CryptoMeme.org - nền tảng Web3 kết hợp bách khoa toàn thư meme và sàn giao dịch văn hóa.

---

# TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           CRYPTOMEME.ORG ARCHITECTURE OVERVIEW                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              PRESENTATION LAYER                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ memepedia-web│  │memepedia-admin│  │ memepedia-app│  │  cm-graph    │            │   │
│  │  │   (NextJS)   │  │  (ReactJS)   │  │(React Native)│  │  (GraphQL)   │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              BACKEND SERVICES LAYER                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         CORE SERVICES (Rust/Actix)                           │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │   │
│  │  │  │cm-encyclopedia│  │cm-verification│ │   cm-swap    │  │ cm-socialfi  │     │    │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      INTEGRATION SERVICES (Node.js)                          │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │   │
│  │  │  │cm-arweave    │  │ cm-rug-check │  │cm-api-gateway│  │cm-auth-client│     │    │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      ANALYTICS SERVICES (Python)                             │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐                                         │    │   │
│  │  │  │ cm-sentiment │  │cm-coingecko  │                                         │    │   │
│  │  │  └──────────────┘  └──────────────┘                                         │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              BLOCKCHAIN LAYER (Solana)                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                              │   │
│  │  │ cm-staking   │  │ cm-kol-keys  │  │cm-governance │                              │   │
│  │  │  (Anchor)    │  │  (Anchor)    │  │  (Anchor)    │                              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                              │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              DATA & STORAGE LAYER                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │  PostgreSQL  │  │    Neo4j     │  │    Redis     │  │ Elasticsearch│            │   │
│  │  │   (Aurora)   │  │  (Genealogy) │  │   (Cache)    │  │   (Search)   │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │  ┌──────────────┐  ┌──────────────┐                                                │   │
│  │  │   Arweave    │  │    Kafka     │                                                │   │
│  │  │  (Permanent) │  │   (Events)   │                                                │   │
│  │  └──────────────┘  └──────────────┘                                                │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                              │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              EXTERNAL INTEGRATIONS                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │   Jupiter    │  │   Helius     │  │  CoinGecko   │  │   The Tie    │            │   │
│  │  │ (DEX Agg)    │  │ (Solana RPC) │  │ (Market Data)│  │ (Sentiment)  │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                              │   │
│  │  │    Privy     │  │  Chainalysis │  │    Jito      │                              │   │
│  │  │   (Auth)     │  │   (AML)      │  │ (MEV Protect)│                              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                              │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# PRESENTATION LAYER - Web/Mobile Applications

## memepedia-web
**Technology:** NextJS 14
**URL:** https://cryptomeme.org
**Mô tả:** Giao diện chính của bách khoa toàn thư meme, tối ưu SEO cho search engines.

**Các tính năng chính:**
- 📚 Browse & Search meme encyclopedia
- 📊 Xem meme profiles với market data
- 💱 Swap widget tích hợp
- 🗳️ Tham gia Proof-of-Culture voting
- 👤 User dashboard & portfolio

## memepedia-admin
**Technology:** ReactJS
**URL:** https://admin.cryptomeme.org
**Mô tả:** Portal quản trị cho curators và moderators.

**Các tính năng chính:**
- ✏️ Content moderation
- 👥 Curator management
- 📊 Platform analytics
- ⚙️ System configuration

## memepedia-app
**Technology:** React Native + Expo
**Platforms:** iOS, Android
**Mô tả:** Ứng dụng mobile cho trải nghiệm on-the-go.

**Các tính năng chính:**
- 📱 Mobile encyclopedia browsing
- 🔔 Push notifications cho alerts
- 💱 Mobile swap
- 📊 Portfolio tracking

## cm-graph
**Technology:** Apollo GraphQL Router
**URL:** https://api.cryptomeme.org/graphql
**Mô tả:** GraphQL gateway hoạt động như Backend For Frontend (BFF).

**Chức năng:**
- Federation gateway cho tất cả backend services
- Schema stitching
- Query caching & optimization
- Authentication middleware

---

# BACKEND SERVICES LAYER

## Core Services (Rust/Actix - High Performance)

### cm-encyclopedia
**Technology:** Rust + Actix Web
**Mô tả:** Service lõi quản lý dữ liệu meme và wiki content.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Meme Profile CRUD | Tạo, đọc, cập nhật hồ sơ meme |
| Genealogy Management | Quản lý mối quan hệ cha-con giữa memes |
| Wiki Content | Quản lý nội dung wiki, versioning |
| Search Indexing | Đồng bộ dữ liệu với Elasticsearch |
| Token Linking | Liên kết meme với contract addresses |

**Integrations:**
- → cm-arweave-bridge: Lưu trữ vĩnh viễn
- → Neo4j: Graph database cho genealogy
- → Elasticsearch: Full-text search
- → Kafka: Publish events

### cm-verification
**Technology:** Rust + Actix Web
**Mô tả:** Service xử lý Proof-of-Culture verification.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Proposal Management | Tạo và quản lý verification proposals |
| Stake Tracking | Theo dõi stake từ cm-staking program |
| Vote Tallying | Tính toán kết quả voting |
| Culture Seal Issuance | Cấp Culture Seal cho verified memes |
| Security Integration | Tích hợp kết quả từ cm-rug-check |

**Integrations:**
- → cm-staking (Solana): On-chain staking
- → cm-rug-check: Security reports
- → cm-encyclopedia: Update meme status
- → Kafka: Publish verification events

### cm-swap
**Technology:** Rust + Actix Web
**Mô tả:** Service tổng hợp thanh khoản và xử lý swap transactions.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Quote Aggregation | Lấy quotes từ Jupiter, Raydium |
| Transaction Building | Tạo swap transactions với platform fee |
| Fee Collection | Thu phí và phân bổ |
| MEV Protection | Tích hợp Jito cho private transactions |
| Transaction Tracking | Theo dõi trạng thái transactions |

**Integrations:**
- → Jupiter API: DEX aggregation
- → Helius RPC: Solana transactions
- → Jito: MEV protection
- → Kafka: Publish swap events

### cm-socialfi
**Technology:** Rust + Actix Web
**Mô tả:** Service quản lý creator economy và KOL features.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Curator Profiles | Quản lý profiles và reputation |
| Contribution Tracking | Theo dõi đóng góp wiki |
| Rewards Calculation | Tính toán phần thưởng |
| KOL Profile Management | Quản lý KOL profiles |
| Premium Content | Quản lý gated content |

**Integrations:**
- → cm-kol-keys (Solana): Bonding curve
- → cm-encyclopedia: Wiki contributions
- → cm-dao-governance: Reward distributions

---

## Integration Services (Node.js/Fastify)

### cm-arweave-bridge
**Technology:** Node.js + Fastify
**Mô tả:** Service bridge với Arweave network cho permanent storage.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Upload | Upload files lên Arweave via Irys/Bundlr |
| Retrieval | Lấy content từ Arweave |
| Manifest Management | Quản lý Arweave manifests |
| Cost Calculation | Tính toán chi phí storage |

**Integrations:**
- → Arweave Network: Permanent storage
- → Irys/Bundlr: Upload service
- → cm-encyclopedia: Content sync

### cm-rug-check
**Technology:** Node.js + Fastify
**Mô tả:** Service phân tích bảo mật token tự động.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Honeypot Detection | Kiểm tra khả năng sell token |
| Liquidity Analysis | Phân tích LP lock status |
| Holder Distribution | Phân tích phân bố holders |
| Contract Analysis | Kiểm tra contract source |
| Risk Scoring | Tính điểm rủi ro tổng hợp |

**Integrations:**
- → GoPlus API: Token security data
- → Helius API: On-chain data
- → cm-verification: Security reports

### cm-api-gateway
**Technology:** Node.js + Fastify
**Mô tả:** Premium API service cho external customers.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| API Key Management | Quản lý API keys và tiers |
| Rate Limiting | Giới hạn requests theo tier |
| Usage Tracking | Theo dõi usage và billing |
| Webhook Management | Quản lý webhook subscriptions |
| Documentation | Swagger/OpenAPI docs |

**API Tiers:**
| Tier | Rate Limit | Features |
|------|------------|----------|
| Free | 100/day | Basic read-only |
| Developer | 10K/day | Full read, webhooks |
| Pro | 100K/day | Sentiment, signals |
| Enterprise | Unlimited | Custom SLA |

### cm-auth-client
**Technology:** Node.js + Fastify
**Mô tả:** Service xác thực tích hợp với Privy.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Social Login | Google, Twitter, Discord |
| Wallet Connection | Phantom, embedded wallets |
| Session Management | JWT sessions |
| MPC Integration | Multi-party computation keys |

**Integrations:**
- → Privy: Auth provider
- → Dynamic: Alternative provider

---

## Analytics Services (Python/FastAPI)

### cm-sentiment
**Technology:** Python + FastAPI
**Mô tả:** Service phân tích sentiment từ social media.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Social Tracking | Track mentions trên Twitter, Reddit |
| Sentiment Scoring | Tính Fear & Greed index |
| Hype Score | Tính điểm "sức nóng" |
| Trend Detection | Phát hiện xu hướng sớm |

**Integrations:**
- → The Tie API: Sentiment data
- → Messari API: Market intelligence
- → Twitter/X API: Social mentions

### cm-coingecko-sync
**Technology:** Python + FastAPI
**Mô tả:** Service đồng bộ market data từ CoinGecko.

**Các chức năng:**
| Chức năng | Mô tả |
|-----------|-------|
| Price Sync | Đồng bộ giá realtime |
| Volume Tracking | Theo dõi volume |
| Market Cap | Cập nhật market cap |
| Historical Data | Lưu trữ dữ liệu lịch sử |

**Integrations:**
- → CoinGecko API: Market data
- → DexScreener API: DEX data
- → Birdeye API: Solana analytics

---

# BLOCKCHAIN LAYER - Solana Programs (Anchor)

## cm-staking
**Technology:** Rust + Anchor Framework
**Mô tả:** Solana program quản lý staking $MEMEORG cho Proof-of-Culture.

**Instructions:**
| Instruction | Mô tả |
|-------------|-------|
| `stake_for_verification` | Stake token để vote |
| `resolve_proposal` | Kết thúc voting và phân bổ |
| `claim_stake` | Rút stake sau lock period |
| `slash_stake` | Slash stake nếu project rugged |

**Accounts:**
```rust
#[account]
pub struct VerificationVault {
    pub proposal_id: Pubkey,      // ID proposal
    pub total_for: u64,           // Total stake FOR
    pub total_against: u64,       // Total stake AGAINST
    pub staker_count: u32,        // Số stakers
    pub voting_end: i64,          // Thời gian kết thúc
    pub status: ProposalStatus,   // Trạng thái
}

#[account]
pub struct StakeRecord {
    pub staker: Pubkey,           // Wallet staker
    pub vault: Pubkey,            // Vault reference
    pub amount: u64,              // Số lượng stake
    pub vote: Vote,               // FOR/AGAINST
    pub locked_until: i64,        // Lock period
}
```

## cm-kol-keys
**Technology:** Rust + Anchor Framework
**Mô tả:** Solana program cho KOL Keys bonding curve.

**Instructions:**
| Instruction | Mô tả |
|-------------|-------|
| `initialize_kol` | Đăng ký KOL mới |
| `buy_keys` | Mua keys theo bonding curve |
| `sell_keys` | Bán keys |
| `withdraw_fees` | KOL rút fees |

**Bonding Curve Formula:**
```
Price = BasePrice * (CurrentSupply / ScaleFactor)^2

- BasePrice = 0.001 SOL
- ScaleFactor = 16000
- Buy Fee = 5% (2.5% KOL + 2.5% Protocol)
- Sell Fee = 5% (2.5% KOL + 2.5% Protocol)
```

## cm-governance
**Technology:** Rust + Anchor Framework
**Mô tả:** Solana program cho DAO governance.

**Instructions:**
| Instruction | Mô tả |
|-------------|-------|
| `create_proposal` | Tạo proposal mới |
| `cast_vote` | Vote on proposal |
| `finalize_proposal` | Kết thúc và execute |
| `delegate` | Delegate voting power |

**Integration:**
- → Realms: DAO infrastructure
- → Squads: Multi-sig treasury

---

# DATA & STORAGE LAYER

## PostgreSQL (AWS Aurora)
**Mô tả:** Database chính cho relational data.

**Schemas:**
| Schema | Mô tả |
|--------|-------|
| `meme` | Meme profiles, tokens, metrics |
| `verification` | Proposals, stakes, seals |
| `socialfi` | Curators, contributions, KOLs |
| `swap` | Transactions, fees |
| `api` | API keys, usage |

## Neo4j
**Mô tả:** Graph database cho meme genealogy.

**Node Types:**
- `(:MemeProfile)` - Meme profiles
- `(:MemeToken)` - Token contracts
- `(:Curator)` - Contributors

**Relationships:**
- `[:DERIVED_FROM]` - Parent-child meme
- `[:FORKED_FROM]` - Fork relationship
- `[:CREATED_BY]` - Creator relationship

## Redis (AWS ElastiCache)
**Mô tả:** Caching và real-time features.

**Use Cases:**
| Use Case | TTL | Mô tả |
|----------|-----|-------|
| API Response Cache | 5-60 min | Cache API responses |
| Rate Limiting | 1 min | API rate limits |
| Session Store | 24h | User sessions |
| Real-time Metrics | 30s | Live price updates |

## Elasticsearch
**Mô tả:** Full-text search cho memes.

**Indices:**
| Index | Mô tả |
|-------|-------|
| `memes` | Meme profiles searchable |
| `wiki_content` | Wiki articles |
| `tokens` | Token contracts |

## Arweave
**Mô tả:** Permanent decentralized storage.

**Stored Data:**
- 🖼️ Meme images/videos gốc
- 📄 Wiki content versions
- 📊 Historical snapshots
- 🔐 Audit trails

## Kafka (AWS MSK)
**Mô tả:** Event streaming platform.

**Topics:**
| Topic | Producers | Consumers |
|-------|-----------|-----------|
| `meme.created` | cm-encyclopedia | cm-arweave, cm-verification |
| `meme.verified` | cm-verification | cm-encyclopedia, cm-swap |
| `swap.completed` | cm-swap | cm-analytics, cm-api |
| `rug.detected` | cm-rug-check | cm-notification, cm-verification |
| `stake.recorded` | cm-staking | cm-verification |
| `key.traded` | cm-kol-keys | cm-analytics |

---

# EXTERNAL INTEGRATIONS

## Blockchain & Web3

### Jupiter
**Mô tả:** DEX aggregator API
**Endpoints:**
- `GET /quote` - Get swap quote
- `POST /swap` - Create swap transaction

### Helius
**Mô tả:** Solana RPC provider
**Features:**
- Enhanced RPC
- Webhooks
- DAS API

### Jito
**Mô tả:** MEV protection
**Features:**
- Bundle transactions
- Private transactions
- Tip routing

## Market Data

### CoinGecko
**Mô tả:** Token market data
**Data:**
- Price, volume, market cap
- Historical data
- Token metadata

### The Tie / Messari
**Mô tả:** Sentiment analysis
**Data:**
- Social sentiment scores
- Fear & Greed index
- Market intelligence

## Security & Compliance

### Chainalysis / Elliptic
**Mô tả:** Blockchain analytics
**Features:**
- AML screening
- Risk scoring
- Sanctions checking

### GoPlus
**Mô tả:** Token security
**Features:**
- Honeypot detection
- Contract analysis
- Risk assessment

## Authentication

### Privy
**Mô tả:** Web3 auth provider
**Features:**
- Social login (Google, Twitter, Discord)
- Embedded wallets (MPC)
- Session management

---

# INFRASTRUCTURE LAYER

## AWS Services

| Service | Mô tả |
|---------|-------|
| **EKS** | Kubernetes orchestration |
| **Aurora PostgreSQL** | Managed PostgreSQL |
| **ElastiCache** | Managed Redis |
| **MSK** | Managed Kafka |
| **S3** | Object storage |
| **CloudFront** | CDN |
| **Secrets Manager** | Secrets management |
| **KMS** | Key management |

## DevOps Tools

| Tool | Mô tả |
|------|-------|
| **Terraform** | Infrastructure as Code |
| **Helm** | Kubernetes deployments |
| **GitHub Actions** | CI pipelines |
| **ArgoCD** | GitOps CD |

## Monitoring

| Tool | Mô tả |
|------|-------|
| **Prometheus** | Metrics collection |
| **Grafana** | Visualization |
| **CloudWatch** | AWS monitoring |
| **PagerDuty** | Alerting |

---

# SERVICE COMMUNICATION PATTERNS

## Synchronous (REST/GraphQL)

```
┌───────────┐     GraphQL     ┌───────────┐      gRPC       ┌───────────┐
│  Frontend │ ──────────────> │ cm-graph  │ ─────────────> │  Backend  │
│           │                 │  (BFF)    │                 │  Services │
└───────────┘                 └───────────┘                 └───────────┘
```

## Asynchronous (Kafka Events)

```
┌───────────┐    publish      ┌───────────┐    consume     ┌───────────┐
│ Producer  │ ──────────────> │   Kafka   │ ─────────────> │ Consumer  │
│  Service  │                 │   Topic   │                │  Service  │
└───────────┘                 └───────────┘                 └───────────┘
```

## Blockchain Integration

```
┌───────────┐    instruction   ┌───────────┐    confirm     ┌───────────┐
│  Backend  │ ──────────────> │  Solana   │ ─────────────> │  Backend  │
│  Service  │                 │  Program  │  (via Helius)  │  Service  │
└───────────┘                 └───────────┘                 └───────────┘
```

---

# DOMAIN-SERVICE MAPPING

| Domain | Services | Database |
|--------|----------|----------|
| **Encyclopedia** | cm-encyclopedia, cm-arweave-bridge | PostgreSQL, Neo4j, Arweave |
| **Verification** | cm-verification, cm-rug-check, cm-staking | PostgreSQL, Solana |
| **Trading** | cm-swap | Redis, Solana |
| **SocialFi** | cm-socialfi, cm-kol-keys | PostgreSQL, Solana |
| **Analytics** | cm-sentiment, cm-coingecko-sync | PostgreSQL, Redis |
| **API** | cm-api-gateway | PostgreSQL, Redis |
| **Auth** | cm-auth-client | Redis |
