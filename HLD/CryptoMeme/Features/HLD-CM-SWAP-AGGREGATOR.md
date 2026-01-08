# HLD-CM-SWAP-AGGREGATOR - Swap Aggregator & Trading Widget

> **Feature**: Tích hợp DEX Aggregator để swap meme coins trực tiếp từ encyclopedia
>
> **Service**: `cm-swap` (Rust/Actix)
>
> **Version**: 1.0 | **Last Updated**: 2025-01

---

## 📋 Mục lục

1. [Bối cảnh (Context)](#1-bối-cảnh-context)
2. [Context Diagram](#2-context-diagram)
3. [Core Business Workflows](#3-core-business-workflows)
4. [State Machine](#4-state-machine)
5. [Data Model](#5-data-model)
6. [Event Architecture](#6-event-architecture)
7. [API Contracts](#7-api-contracts)
8. [Integration Points](#8-integration-points)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Appendix](#10-appendix)

---

## 1. Bối cảnh (Context)

### 1.1 Bối cảnh Kinh doanh

**Vấn đề:**
- Người dùng phải rời CryptoMeme để giao dịch trên DEXs khác
- Tăng friction, mất conversion trong user journey
- Không capture được giá trị từ trading volume
- Khó theo dõi và phân tích hành vi giao dịch

**Giải pháp Swap Aggregator:**
- Tích hợp Jupiter Aggregator (Solana #1 DEX) trực tiếp trong encyclopedia
- Swap widget nhúng trong trang meme profile
- Thu phí giao dịch nhỏ (0.1-0.5%) làm revenue stream
- MEV protection qua Jito integration

**Giá trị mang lại:**
| Stakeholder | Giá trị |
|-------------|---------|
| Nhà đầu tư | Giao dịch nhanh, tiện lợi ngay tại nơi research |
| Platform | Revenue từ trading fees |
| DAO Treasury | Phí giao dịch đóng góp vào quỹ |
| Token projects | Tăng liquidity và visibility |

### 1.2 Bối cảnh Hệ thống

**Swap Aggregator** cung cấp:

1. **Route Optimization** - Tìm route tốt nhất qua Jupiter
2. **Swap Execution** - Thực hiện swap với slippage protection
3. **Fee Collection** - Thu phí và phân phối cho DAO
4. **MEV Protection** - Sử dụng Jito bundles để bảo vệ giao dịch
5. **Analytics** - Theo dõi volume, popular pairs

**Services liên quan:**
- `cm-swap` (Rust/Actix) - Core swap logic
- `cm-encyclopedia` (Rust) - Meme data provider
- Jupiter API - Route aggregation
- Jito - MEV protection

### 1.3 Phạm vi Ngoài (Out of Scope)

| Phạm vi trong | Phạm vi ngoài |
|---------------|---------------|
| Jupiter integration | Custom AMM development |
| Basic swap widget | Advanced trading UI (limit orders, charts) |
| Fee collection | Fiat on/off-ramp |
| Volume tracking | Market making |
| MEV protection | Arbitrage detection |

### 1.4 Actors & Permissions

| Actor | Mô tả | Permissions |
|-------|-------|-------------|
| **Trader** | Người thực hiện swap | Quote, Swap, View history |
| **Verified Meme** | Token đã xác thực | Higher visibility, lower fees |
| **Platform** | CryptoMeme system | Collect fees, configure rates |
| **DAO** | Governance | Update fee structure |

---

## 2. Context Diagram

```mermaid
C4Context
    title Swap Aggregator System Context

    Person(trader, "Trader", "Người muốn swap tokens")

    System(swap, "Swap Aggregator", "DEX aggregation và fee collection")

    System_Ext(encyclopedia, "MemePedia", "Token data source")
    System_Ext(jupiter, "Jupiter", "DEX Aggregator API")
    System_Ext(jito, "Jito", "MEV Protection")
    System_Ext(solana, "Solana", "Blockchain execution")
    System_Ext(wallet, "User Wallet", "Phantom/Privy")

    Rel(trader, swap, "Get quote, Execute swap")
    Rel(swap, encyclopedia, "Fetch token info")
    Rel(swap, jupiter, "Get routes, Build TX")
    Rel(swap, jito, "Submit protected TX")
    Rel(swap, solana, "Execute swap")
    Rel(trader, wallet, "Sign transaction")
```

---

## 3. Core Business Workflows

### 3.1 Get Quote Flow

```mermaid
sequenceDiagram
    autonumber
    participant T as Trader
    participant UI as Swap Widget
    participant API as cm-swap
    participant J as Jupiter API
    participant ENC as cm-encyclopedia

    T->>UI: Select input/output tokens
    UI->>API: GET /quote

    par Fetch token data
        API->>ENC: Get token info
        ENC-->>API: Token metadata, verification status
    and Get Jupiter routes
        API->>J: GET /quote
        J-->>API: Routes with prices
    end

    API->>API: Apply platform fee (0.1-0.5%)
    API->>API: Select best route

    API-->>UI: Quote response
    Note over UI: Display: rate, fees, price impact

    UI-->>T: Show quote
```

### 3.2 Execute Swap Flow

```mermaid
sequenceDiagram
    autonumber
    participant T as Trader
    participant W as Wallet
    participant API as cm-swap
    participant J as Jupiter API
    participant JITO as Jito
    participant SOL as Solana
    participant K as Kafka

    T->>API: POST /swap (quote_id)
    API->>J: GET /swap-instructions
    J-->>API: Transaction instructions

    API->>API: Add fee instruction
    API->>API: Build transaction

    API-->>T: Unsigned transaction

    T->>W: Request signature
    W-->>T: Signed transaction

    T->>API: POST /execute (signed_tx)

    alt MEV Protection Enabled
        API->>JITO: Submit bundle
        JITO->>SOL: Execute with protection
        SOL-->>JITO: Confirmation
        JITO-->>API: Bundle result
    else Standard Execution
        API->>SOL: Submit transaction
        SOL-->>API: Confirmation
    end

    API->>API: Record swap in database
    API->>K: Publish swap.completed

    API-->>T: Swap result
```

### 3.3 Fee Distribution Flow

```mermaid
sequenceDiagram
    autonumber
    participant SWAP as cm-swap
    participant FEE as Fee Account
    participant DAO as DAO Treasury
    participant K as Kafka

    Note over SWAP: Accumulated fees reach threshold

    loop Daily fee sweep
        SWAP->>FEE: Check accumulated fees
        FEE-->>SWAP: Fee balance

        alt Balance >= SWEEP_THRESHOLD
            SWAP->>DAO: Transfer fees to treasury
            DAO-->>SWAP: Transfer confirmed
            SWAP->>K: Publish fees.distributed
        end
    end
```

### 3.4 Route Optimization Flow

```mermaid
sequenceDiagram
    autonumber
    participant API as cm-swap
    participant J as Jupiter API
    participant CACHE as Redis Cache

    API->>CACHE: Check cached routes

    alt Cache hit (< 10s old)
        CACHE-->>API: Cached routes
    else Cache miss
        API->>J: Request all routes
        J-->>API: Available routes

        API->>API: Score routes
        Note over API: Score = output - (slippage * weight) - (fee * weight)

        API->>API: Filter by min output
        API->>API: Sort by score

        API->>CACHE: Cache routes (10s TTL)
    end

    API->>API: Return top 3 routes
```

---

## 4. State Machine

### 4.1 Swap Transaction States

```mermaid
stateDiagram-v2
    [*] --> QuoteRequested: Request quote

    QuoteRequested --> QuoteReady: Routes found
    QuoteRequested --> QuoteFailed: No routes available

    QuoteFailed --> [*]

    QuoteReady --> TransactionBuilt: Build TX

    TransactionBuilt --> AwaitingSignature: Send to wallet

    AwaitingSignature --> Signed: User signs
    AwaitingSignature --> Cancelled: User rejects
    AwaitingSignature --> Expired: Timeout (2 min)

    Cancelled --> [*]
    Expired --> [*]

    Signed --> Submitted: Submit to network

    Submitted --> Confirmed: On-chain confirmation
    Submitted --> Failed: Transaction error

    Failed --> QuoteRequested: Retry with new quote

    Confirmed --> [*]
```

---

## 5. Data Model

### 5.1 Entity Relationship Diagram

```mermaid
erDiagram
    SWAP_QUOTE ||--o| SWAP_TRANSACTION : "results_in"
    SWAP_TRANSACTION ||--|| FEE_RECORD : "generates"
    TOKEN ||--o{ SWAP_TRANSACTION : "involved_in"
    USER ||--o{ SWAP_TRANSACTION : "executes"

    SWAP_QUOTE {
        uuid id PK
        string input_token
        string output_token
        bigint input_amount
        bigint output_amount
        decimal price_impact
        decimal platform_fee_bps
        jsonb routes
        timestamp expires_at
        timestamp created_at
    }

    SWAP_TRANSACTION {
        uuid id PK
        uuid quote_id FK
        string trader_wallet
        string input_token
        string output_token
        bigint input_amount
        bigint output_amount
        bigint actual_output
        decimal slippage
        string route_used
        decimal platform_fee
        string tx_signature UK
        enum status
        boolean mev_protected
        timestamp created_at
        timestamp confirmed_at
    }

    FEE_RECORD {
        uuid id PK
        uuid swap_id FK
        string token_mint
        bigint fee_amount
        enum status
        string sweep_tx_signature
        timestamp created_at
        timestamp swept_at
    }

    TOKEN {
        string mint_address PK
        string symbol
        string name
        int decimals
        boolean is_verified
        decimal total_volume_24h
        int swap_count_24h
    }

    SWAP_STATS {
        date stat_date PK
        string token_mint PK
        bigint total_volume
        int swap_count
        decimal avg_slippage
        decimal total_fees_collected
    }
```

### 5.2 Key Entities

| Entity | Mô tả | Storage |
|--------|-------|---------|
| `SWAP_QUOTE` | Quote request và kết quả | Redis (short TTL) + PostgreSQL |
| `SWAP_TRANSACTION` | Lịch sử swap thực hiện | PostgreSQL |
| `FEE_RECORD` | Phí thu được từ swap | PostgreSQL |
| `TOKEN` | Token metadata cache | PostgreSQL + Redis |
| `SWAP_STATS` | Thống kê daily | PostgreSQL (aggregated) |

---

## 6. Event Architecture

### 6.1 Published Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `swap.quote_requested` | User requests quote | `{input, output, amount}` | cm-analytics |
| `swap.completed` | Swap confirmed | `{swap_id, tokens, amounts, fee}` | cm-analytics, cm-api |
| `swap.failed` | Swap error | `{swap_id, error_code, reason}` | cm-analytics |
| `fees.collected` | New fee recorded | `{token, amount}` | cm-analytics |
| `fees.distributed` | Fees sent to DAO | `{total, tx_signature}` | cm-notification |

### 6.2 Consumed Events

| Event | Source | Handler |
|-------|--------|---------|
| `meme.verified` | cm-verification | Update token verification status |
| `token.price_updated` | cm-coingecko-sync | Update cached prices |
| `token.rug_detected` | cm-rug-check | Disable swaps for token |

---

## 7. API Contracts

### 7.1 GraphQL Schema

```graphql
# Types
type SwapQuote {
  id: ID!
  inputToken: Token!
  outputToken: Token!
  inputAmount: String!
  outputAmount: String!
  minimumReceived: String!
  priceImpact: Float!
  platformFee: Float!
  platformFeeBps: Int!
  routes: [SwapRoute!]!
  expiresAt: DateTime!
}

type SwapRoute {
  name: String!
  inputAmount: String!
  outputAmount: String!
  priceImpact: Float!
  steps: [RouteStep!]!
}

type RouteStep {
  ammId: String!
  ammLabel: String!
  inputMint: String!
  outputMint: String!
  inputAmount: String!
  outputAmount: String!
  feeAmount: String!
}

type Token {
  mint: String!
  symbol: String!
  name: String!
  decimals: Int!
  logoUri: String
  isVerified: Boolean!
  cultureSeal: CultureSeal
  price: Float
}

type SwapTransaction {
  id: ID!
  inputToken: Token!
  outputToken: Token!
  inputAmount: String!
  outputAmount: String!
  actualOutput: String
  slippage: Float!
  platformFee: String!
  txSignature: String
  status: SwapStatus!
  mevProtected: Boolean!
  createdAt: DateTime!
  confirmedAt: DateTime
}

enum SwapStatus {
  QUOTE_READY
  AWAITING_SIGNATURE
  SUBMITTED
  CONFIRMED
  FAILED
  CANCELLED
  EXPIRED
}

type SwapStats {
  token: Token!
  volume24h: String!
  swapCount24h: Int!
  avgSlippage: Float!
}

# Queries
type Query {
  # Quote
  swapQuote(
    inputMint: String!
    outputMint: String!
    amount: String!
    slippageBps: Int = 50
  ): SwapQuote!

  # Token
  swappableTokens(
    search: String
    verifiedOnly: Boolean = false
    first: Int = 50
  ): [Token!]!

  tokenInfo(mint: String!): Token

  # History
  mySwapHistory(
    first: Int = 20
    after: String
  ): SwapTransactionConnection!

  swapTransaction(id: ID!): SwapTransaction

  # Stats
  topSwappedTokens(
    timeframe: Timeframe = DAY
    first: Int = 20
  ): [SwapStats!]!

  platformSwapStats(timeframe: Timeframe = DAY): PlatformSwapStats!
}

type PlatformSwapStats {
  totalVolume: String!
  totalSwaps: Int!
  totalFeesCollected: String!
  uniqueTraders: Int!
}

# Mutations
type Mutation {
  # Swap execution
  buildSwapTransaction(
    quoteId: ID!
    userWallet: String!
    mevProtection: Boolean = true
  ): SwapTransactionData!

  executeSwap(
    quoteId: ID!
    signedTransaction: String!
  ): SwapTransaction!

  cancelSwap(swapId: ID!): Boolean!
}

type SwapTransactionData {
  swapId: ID!
  transaction: String!  # Base64 encoded
  expiresAt: DateTime!
}

# Subscriptions
type Subscription {
  swapStatusUpdated(swapId: ID!): SwapTransaction!
}
```

### 7.2 REST Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/swap/quote` | Get swap quote |
| `POST` | `/api/v1/swap/transaction` | Build swap transaction |
| `POST` | `/api/v1/swap/execute` | Execute signed swap |
| `GET` | `/api/v1/swap/{id}` | Get swap status |
| `GET` | `/api/v1/swap/history` | Get user swap history |
| `GET` | `/api/v1/tokens` | List swappable tokens |
| `GET` | `/api/v1/tokens/{mint}` | Get token info |

### 7.3 Jupiter API Integration

```rust
// Jupiter Quote Request
pub struct JupiterQuoteRequest {
    pub input_mint: String,
    pub output_mint: String,
    pub amount: u64,
    pub slippage_bps: u16,
    pub only_direct_routes: bool,
    pub as_legacy_transaction: bool,
}

// Jupiter Quote Response
pub struct JupiterQuoteResponse {
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub out_amount: String,
    pub other_amount_threshold: String,
    pub swap_mode: String,
    pub slippage_bps: u16,
    pub price_impact_pct: f64,
    pub route_plan: Vec<RoutePlanStep>,
}

// Jupiter Swap Request
pub struct JupiterSwapRequest {
    pub quote_response: JupiterQuoteResponse,
    pub user_public_key: String,
    pub wrap_and_unwrap_sol: bool,
    pub use_shared_accounts: bool,
    pub fee_account: Option<String>,
    pub compute_unit_price_micro_lamports: Option<u64>,
}
```

---

## 8. Integration Points

### 8.1 External Integrations

| System | Integration Type | Mục đích |
|--------|------------------|----------|
| **Jupiter API** | REST API | Route aggregation |
| **Jito Block Engine** | gRPC | MEV protection |
| **Helius RPC** | Solana RPC | Transaction submission |
| **Privy** | SDK | Wallet connection |

### 8.2 Internal Service Dependencies

```mermaid
graph LR
    subgraph Swap Aggregator
        S[cm-swap]
    end

    S --> E[cm-encyclopedia]
    S --> J[Jupiter API]
    S --> JITO[Jito]
    S --> SOL[Helius RPC]
    S --> R[Redis Cache]
    S --> K[Kafka]
```

### 8.3 Data Flow Summary

| Source | Destination | Data | Protocol |
|--------|-------------|------|----------|
| cm-swap | Jupiter | Quote/Swap requests | REST |
| cm-swap | Jito | Protected bundles | gRPC |
| cm-swap | Helius | Transaction submission | JSON-RPC |
| cm-swap | Redis | Quote caching | Redis protocol |
| cm-swap | Kafka | Swap events | Kafka |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target | Đo lường |
|--------|--------|----------|
| Quote latency | < 500ms | P95 latency |
| Swap execution | < 2s (excluding confirmation) | P95 latency |
| Route caching | 10s TTL | Cache hit rate > 80% |
| Concurrent quotes | 1000+ QPS | Load test |

### 9.2 Scalability

| Dimension | Target |
|-----------|--------|
| Daily swaps | 100,000+ |
| Concurrent users | 10,000+ |
| Token pairs | Unlimited (via Jupiter) |
| Route options | Top 5 per quote |

### 9.3 Security

| Aspect | Requirement |
|--------|-------------|
| Transaction integrity | Signature verification |
| MEV protection | Jito bundles by default |
| Slippage protection | User-defined max slippage |
| Rate limiting | 10 quotes/s per user |

### 9.4 Availability

| Component | Target SLA |
|-----------|------------|
| Quote API | 99.9% |
| Swap execution | 99.5% |
| Jupiter dependency | Fallback to direct routes |

---

## 10. Appendix

### 10.1 Fee Structure

| Token Type | Platform Fee | DAO Share | Notes |
|------------|--------------|-----------|-------|
| Verified (Culture Seal) | 0.1% | 80% | Lowest fee tier |
| Unverified | 0.3% | 80% | Standard fee |
| New/Risky | 0.5% | 80% | Higher fee for protection |

### 10.2 MEV Protection Options

| Option | Provider | Benefit | Tradeoff |
|--------|----------|---------|----------|
| Jito Bundle | Jito | Best protection | Slight delay |
| Priority Fee | Helius | Faster | Less protection |
| Standard | Default RPC | Cheapest | No protection |

### 10.3 Slippage Recommendations

| Market Condition | Recommended Slippage |
|------------------|---------------------|
| High liquidity pairs | 0.5% |
| Medium liquidity | 1-2% |
| Low liquidity meme coins | 5-10% |
| New launches | 10-15% |

### 10.4 Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `INSUFFICIENT_LIQUIDITY` | Not enough liquidity | Try smaller amount |
| `SLIPPAGE_EXCEEDED` | Price moved too much | Increase slippage |
| `TOKEN_FROZEN` | Token account frozen | Check token status |
| `ROUTE_NOT_FOUND` | No viable route | Try different pair |
| `QUOTE_EXPIRED` | Quote timed out | Request new quote |
| `SIGNATURE_INVALID` | Bad transaction signature | Re-sign transaction |

### 10.5 Related Documents

- [HLD-CM-MEMEPEDIA.md](../Core/HLD-CM-MEMEPEDIA.md) - Token data source
- [HLD-CM-RUG-CHECK.md](./HLD-CM-RUG-CHECK.md) - Token safety check
- [Tech-Stack.md](../../../Design/Tech-Stack.md) - Technology stack
