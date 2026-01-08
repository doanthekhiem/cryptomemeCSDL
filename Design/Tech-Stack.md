# Technology Stacks - CryptoMeme.org

Đây là các stacks được sử dụng trong toàn bộ hệ sinh thái CryptoMeme.org, từ Frontend, Mobile → GraphQL → Backend Services → Blockchain → Storage → Infrastructure.

---

## 1. Frontend Development

### Web Application
| Stack | Version | Mục đích |
|-------|---------|----------|
| **NextJS** | 14.x | Main web app với SSR/SSG cho SEO |
| **ReactJS** | 18.x | Admin portal, internal tools |
| **Tailwind CSS** | 3.x | Styling framework |
| **shadcn/ui** | latest | Component library |
| **TanStack Query** | 5.x | Server state management |
| **Zustand** | 4.x | Client state management |

### Mobile Application
| Stack | Version | Mục đích |
|-------|---------|----------|
| **React Native** | 0.73+ | Cross-platform mobile app |
| **Expo** | 50.x | Development framework |

---

## 2. GraphQL Layer

GraphQL được sử dụng như Backend For Frontend (BFF) cho toàn bộ requests từ frontend và mobile.

| Stack | Version | Mục đích |
|-------|---------|----------|
| **Apollo GraphQL Router** | 1.x | Federation gateway |
| **Apollo GraphQL Client** | 3.x | Frontend GraphQL client |
| **GraphQL Code Generator** | latest | Type generation |

---

## 3. Backend Development

### Rust (Primary cho Performance-Critical Services)
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Rust** | 1.75+ | Main backend language |
| **Actix Web** | 4.x | High-performance web framework |
| **Tokio** | 1.x | Async runtime |
| **SQLx** | 0.7+ | Database access |
| **SeaORM** | 0.12+ | ORM (optional) |

**Services sử dụng Rust:**
- `cm-encyclopedia` - Core meme data management
- `cm-swap` - Swap aggregation
- `cm-verification` - Proof-of-Culture logic

### Node.js (Secondary cho Integration Services)
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Node.js** | 22.x LTS | Runtime |
| **Fastify** | 4.x | Web framework |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 5.x | ORM |

**Services sử dụng Node.js:**
- `cm-arweave-bridge` - Arweave integration
- `cm-rug-check` - Security analysis
- `cm-api-gateway` - Premium API service
- `cm-graph` - GraphQL BFF

### Python (Analytics & AI Services)
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Python** | 3.12+ | Runtime |
| **FastAPI** | 0.109+ | Web framework |
| **Pydantic** | 2.x | Data validation |

**Services sử dụng Python:**
- `cm-sentiment` - Social sentiment analysis
- `cm-coingecko-sync` - Market data sync

---

## 4. Blockchain & Web3

### Solana Ecosystem
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Solana** | 1.18+ | Primary blockchain |
| **Anchor** | 0.30+ | Smart contract framework |
| **Solana Web3.js** | 1.x | JavaScript SDK |
| **@solana/wallet-adapter** | latest | Wallet connection |

### Solana Programs (Smart Contracts)
| Program | Mục đích |
|---------|----------|
| `cm-staking` | $MEMEORG staking cho Proof-of-Culture |
| `cm-kol-keys` | Bonding curve cho KOL Keys |
| `cm-governance` | DAO voting và proposals |

### External Web3 Services
| Service | Mục đích |
|---------|----------|
| **Helius** | Solana RPC provider |
| **Jupiter** | DEX aggregator API |
| **Jito** | MEV protection |
| **Realms** | DAO governance SDK |
| **Squads** | Multi-sig treasury |

### Wallet & Authentication
| Stack | Mục đích |
|-------|----------|
| **Privy** | Social login + embedded wallets (Primary) |
| **Dynamic** | Alternative wallet auth provider |
| **Phantom** | Native Solana wallet support |

---

## 5. Storage Solutions

### Permanent Storage (Arweave)
| Stack | Mục đích |
|-------|----------|
| **Arweave** | Permanent decentralized storage |
| **ArDrive** | File management on Arweave |
| **Bundlr/Irys** | Arweave upload service |

**Dữ liệu lưu trữ trên Arweave:**
- Meme images/videos gốc
- Wiki content versions
- Historical snapshots

### Relational Database
| Stack | Version | Mục đích |
|-------|---------|----------|
| **PostgreSQL** | 16.x | Primary database |
| **AWS Aurora PostgreSQL** | (Production) | Managed PostgreSQL |
| **AWS RDS** | (Non-Production) | Development/Staging |

### Graph Database
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Neo4j** | 5.x | Meme genealogy relationships |
| **DGraph** | (Alternative) | Graph queries |

### Cache & Session
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Redis** | 7.x | Caching, rate limiting, sessions |
| **AWS ElastiCache** | (Production) | Managed Redis |

### Search Engine
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Elasticsearch** | 8.x | Full-text meme search |
| **OpenSearch** | (AWS Alternative) | Managed search |

### Object Storage
| Stack | Mục đích |
|-------|----------|
| **AWS S3** | CDN assets, backups, temp storage |
| **CloudFront** | CDN distribution |

---

## 6. Messaging & Events

| Stack | Version | Mục đích |
|-------|---------|----------|
| **Apache Kafka** | 3.x | Event streaming platform |
| **AWS MSK** | (Production) | Managed Kafka |
| **Redis Pub/Sub** | - | Real-time notifications |

### Event Topics
| Topic | Producers | Consumers |
|-------|-----------|-----------|
| `meme.created` | cm-encyclopedia | cm-arweave-bridge, cm-verification |
| `meme.verified` | cm-verification | cm-encyclopedia, cm-swap |
| `token.rug-detected` | cm-rug-check | cm-notification, cm-api |
| `swap.completed` | cm-swap | cm-analytics |

---

## 7. External APIs & Data Sources

### Market Data
| API | Mục đích |
|-----|----------|
| **CoinGecko API** | Token prices, volume, market cap |
| **DexScreener API** | DEX trading data |
| **Birdeye API** | Solana token analytics |

### Sentiment & Social
| API | Mục đích |
|-----|----------|
| **The Tie API** | Crypto sentiment analysis |
| **Messari API** | Market intelligence |
| **Twitter/X API** | Social mentions tracking |

### Security & Compliance
| API | Mục đích |
|-----|----------|
| **Chainalysis** | Blockchain analytics, AML |
| **Elliptic** | Transaction screening |
| **GoPlus** | Token security scanning |

---

## 8. Infrastructure & DevOps

### Cloud Platform
| Stack | Mục đích |
|-------|----------|
| **AWS** | Primary cloud provider |
| **AWS EKS** | Kubernetes orchestration |
| **AWS ECR** | Container registry |

### Infrastructure as Code
| Stack | Version | Mục đích |
|-------|---------|----------|
| **Terraform** | 1.6+ | Infrastructure provisioning |
| **Helm** | 3.x | Kubernetes deployments |

### CI/CD Pipeline
| Stack | Mục đích |
|-------|----------|
| **GitHub Actions** | CI/CD automation |
| **ArgoCD** | GitOps CD |

### Source Control
| Stack | Mục đích |
|-------|----------|
| **GitHub** | Code repository |

### Secrets Management
| Stack | Mục đích |
|-------|----------|
| **AWS Secrets Manager** | Service configurations |
| **AWS KMS** | Key management |
| **HashiCorp Vault** | Advanced secrets (optional) |

---

## 9. Monitoring & Observability

### Logging
| Stack | Mục đích |
|-------|----------|
| **AWS CloudWatch** | Log aggregation |
| **Grafana Loki** | Log querying (optional) |

### Metrics
| Stack | Mục đích |
|-------|----------|
| **Prometheus** | Metrics collection |
| **Grafana** | Visualization |
| **AWS CloudWatch Metrics** | AWS-native metrics |

### Tracing
| Stack | Mục đích |
|-------|----------|
| **AWS X-Ray** | Distributed tracing |
| **Jaeger** | Alternative tracing |

### Alerting
| Stack | Mục đích |
|-------|----------|
| **PagerDuty** | Incident management |
| **Slack** | Alert notifications |

---

## 10. Security Tools

### Smart Contract Security
| Tool | Mục đích |
|------|----------|
| **Anchor Test** | Unit testing |
| **Soteria** | Solana security scanner |
| **Sec3** | Audit platform |

### Application Security
| Tool | Mục đích |
|------|----------|
| **Snyk** | Dependency vulnerability scanning |
| **SonarQube** | Code quality & security |
| **OWASP ZAP** | Dynamic security testing |

### Bug Bounty
| Platform | Mục đích |
|----------|----------|
| **Immunefi** | Bug bounty program |

---

## 11. Development Tools

### IDE & Extensions
| Tool | Mục đích |
|------|----------|
| **VS Code** | Primary IDE |
| **Rust Analyzer** | Rust language support |
| **Solana Extension** | Anchor development |

### API Development
| Tool | Mục đích |
|------|----------|
| **Postman** | API testing |
| **GraphQL Playground** | GraphQL testing |

### Database Tools
| Tool | Mục đích |
|------|----------|
| **DBeaver** | Database management |
| **Neo4j Browser** | Graph visualization |

---

## Version Pinning Policy

| Category | Policy |
|----------|--------|
| **Programming Languages** | LTS versions, update annually |
| **Frameworks** | Latest stable, update quarterly |
| **Blockchain SDKs** | Track latest stable closely |
| **AWS Services** | Use managed services, auto-update |
| **Security Tools** | Always latest |

---

## Technology Selection Rationale

| Choice | Rationale |
|--------|-----------|
| **Rust over Go/Java** | Performance critical cho swap, verification; Memory safety |
| **Solana over Ethereum** | High TPS, low fees, meme coin ecosystem |
| **Arweave over IPFS** | Permanent storage, no pinning required |
| **Privy over custom auth** | MPC wallets, social login, better UX |
| **NextJS over SPA** | SEO critical cho encyclopedia |
| **Neo4j** | Native graph queries cho meme genealogy |
