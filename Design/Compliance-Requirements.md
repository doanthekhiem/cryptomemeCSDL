# CRYPTOMEME.ORG - ĐIỀU KIỆN TUÂN THỦ & YÊU CẦU BẮT BUỘC

> **Tài liệu tổng hợp tất cả các điều kiện bắt buộc phải tuân thủ khi phát triển CryptoMeme.org**

---

## MỤC LỤC

1. [Yêu cầu Bảo mật API](#1-yêu-cầu-bảo-mật-api)
2. [Yêu cầu Rug-Check & An toàn Token](#2-yêu-cầu-rug-check--an-toàn-token)
3. [Yêu cầu KOL Keys & Bonding Curve](#3-yêu-cầu-kol-keys--bonding-curve)
4. [Yêu cầu DAO Governance](#4-yêu-cầu-dao-governance)
5. [Yêu cầu Swap Aggregator](#5-yêu-cầu-swap-aggregator)
6. [Yêu cầu SocialFi & Curator](#6-yêu-cầu-socialfi--curator)
7. [Yêu cầu Proof-of-Culture](#7-yêu-cầu-proof-of-culture)
8. [Yêu cầu Phi Chức năng (Non-Functional)](#8-yêu-cầu-phi-chức-năng)

---

## 1. YÊU CẦU BẢO MẬT API

### 1.1. Rate Limiting theo Tier (BẮT BUỘC)

| Tier | Rate Limit | Calls/Tháng | WebSocket | Webhooks |
|------|------------|-------------|-----------|----------|
| **Free** | 10/phút | 1,000 | Không | Không |
| **Developer** | 100/phút | 50,000 | 5 kênh | Không |
| **Professional** | 1,000/phút | 500,000 | 50 kênh | 10 endpoints |
| **Enterprise** | 10,000/phút | Không giới hạn | Custom | Custom |

### 1.2. Định dạng API Key (BẮT BUỘC)

```
Format: cm_live_{tier}_{random}
Ví dụ:  cm_live_pro_a1b2c3d4e5f6g7h8i9j0

Test:   cm_test_{tier}_{random}
```

### 1.3. Bảo mật API Key (BẮT BUỘC)

| Yêu cầu | Mô tả |
|---------|-------|
| **Lưu trữ** | PHẢI hash bằng bcrypt - KHÔNG lưu plaintext |
| **Transport** | CHỈ TLS 1.3 - KHÔNG chấp nhận phiên bản cũ hơn |
| **Authentication** | API key + HMAC bắt buộc |
| **Rate Limiting** | Per-key VÀ per-IP đồng thời |
| **Input Validation** | Schema validation nghiêm ngặt |

### 1.4. SLA theo Tier (BẮT BUỘC)

| Tier | Uptime SLA |
|------|------------|
| Free | Best effort (không cam kết) |
| Developer | 99.5% |
| Professional | 99.9% |
| Enterprise | 99.99% |

### 1.5. Webhook Security (BẮT BUỘC)

| Yêu cầu | Chi tiết |
|---------|----------|
| Signature | HMAC-SHA256 bắt buộc |
| Headers bắt buộc | `X-Webhook-ID`, `X-Webhook-Timestamp`, `X-Webhook-Signature` |
| Timestamp | PHẢI trong vòng 5 phút |

---

## 2. YÊU CẦU RUG-CHECK & AN TOÀN TOKEN

### 2.1. Thuật toán Scoring (BẮT BUỘC - 100 điểm)

| Tiêu chí | Điểm tối đa |
|----------|-------------|
| Token Metadata | 15 điểm |
| Holder Distribution | 25 điểm |
| Liquidity | 25 điểm |
| Contract Safety | 20 điểm |
| Trading Activity | 15 điểm |
| **TỔNG** | **100 điểm** |

### 2.2. Auto-Reject Triggers (BẮT BUỘC)

| Trigger | Hành động |
|---------|-----------|
| **Honeypot detected** | **TỰ ĐỘNG REJECT - Score = 0** |
| Mint authority active + Score < 50 | Reject |
| Fake metadata + Score < 50 | Reject |

### 2.3. Score-Based Status (BẮT BUỘC)

| Score | Status | Màu hiển thị |
|-------|--------|--------------|
| 80-100 | Safe | Xanh lá |
| 60-79 | Generally Safe | Xanh nhạt |
| 40-59 | Caution | Vàng |
| 20-39 | Dangerous | Cam |
| 0-19 | Critical (scam/honeypot) | Đỏ |

### 2.4. Red Flags & Trừ điểm (BẮT BUỘC)

| Red Flag | Điểm trừ |
|----------|----------|
| Honeypot | **-100 (auto-reject)** |
| Mint authority active | -20 |
| Top holder > 30% | -15 |
| Fake metadata | -15 |
| LP < $1,000 | -10 |
| Token age < 1 giờ | -10 |

### 2.5. Kiểm tra Bắt buộc

- [ ] Honeypot detection (simulation buy → sell)
- [ ] Mint authority verification
- [ ] Freeze authority revocation check
- [ ] Liquidity pool analysis
- [ ] Holder concentration analysis

---

## 3. YÊU CẦU KOL KEYS & BONDING CURVE

### 3.1. Công thức Bonding Curve (BẮT BUỘC)

```
price(supply) = base_price * (supply² / divisor)
```

### 3.2. Cấu hình Mặc định (BẮT BUỘC)

| Parameter | Giá trị | Ghi chú |
|-----------|---------|---------|
| Base Price | 1,000,000 lamports | 0.001 SOL |
| Divisor | 16,000 | |
| KOL Fee | 500 basis points | 5% |
| Platform Fee | 500 basis points | 5% |
| **Total Fee** | **10%** | **BẮT BUỘC** |

### 3.3. Phân chia Phí (BẮT BUỘC)

| Recipient | Tỷ lệ |
|-----------|-------|
| KOL | 5% giá trị giao dịch |
| Platform | 5% giá trị giao dịch |
| Bonding Curve Pool | 90% còn lại |

### 3.4. Slippage Protection (BẮT BUỘC)

| Loại giao dịch | Yêu cầu |
|----------------|---------|
| Buy | PHẢI có `max_cost` |
| Sell | PHẢI có `min_return` |
| Vượt ngưỡng | **Transaction bị reject** |

### 3.5. Error Codes (BẮT BUỘC)

| Code | Mô tả |
|------|-------|
| `InsufficientFunds` | Không đủ SOL |
| `SlippageExceeded` | Giá vượt ngưỡng tolerance |
| `InsufficientKeys` | Không đủ keys để bán |
| `CurvePaused` | Trading tạm dừng |
| `InvalidAmount` | Amount phải > 0 |
| `MathOverflow` | Tràn số trong tính toán |

---

## 4. YÊU CẦU DAO GOVERNANCE

### 4.1. Governance Parameters (BẮT BUỘC)

| Parameter | Giá trị | Có thể thay đổi |
|-----------|---------|-----------------|
| Proposal Threshold | 100,000 $MEMEORG (0.01%) | Có |
| Quorum | 4% circulating supply | Có |
| Approval Threshold | 50% + 1 vote | Có |
| Voting Period | 5 ngày | Có |
| Timelock | 48 giờ | Có |
| Emergency Timelock | 6 giờ | **KHÔNG** |

### 4.2. Council Requirements (BẮT BUỘC)

| Yêu cầu | Giá trị |
|---------|---------|
| Threshold | 3/5 signatures |
| Tổng số Council | 5 members |
| Core Team | 2 seats |
| Community Elected | 2 seats |
| Advisor | 1 seat |

### 4.3. Proposal Types & Thresholds (BẮT BUỘC)

| Loại Proposal | Min Stake | Voting Period | Timelock |
|---------------|-----------|---------------|----------|
| Parameter Change | 100K | 5 ngày | 48h |
| Treasury < 10K SOL | 100K | 5 ngày | 48h |
| Treasury >= 10K SOL | 500K | 7 ngày | 72h |
| Council Change | 500K | 7 ngày | 72h |
| **Emergency** | Guardian only | 24h | 6h |

### 4.4. Bảo mật DAO (BẮT BUỘC)

| Yêu cầu | Chi tiết |
|---------|----------|
| Vote Integrity | On-chain verification |
| Treasury | Multi-sig 3/5 |
| Emergency | Guardian veto power |
| Timelocks | 48h execution (6h emergency) |

### 4.5. $MEMEORG Tokenomics (BẮT BUỘC)

| Allocation | % | Vesting |
|------------|---|---------|
| Community/Airdrop | 40% | 6 tháng linear |
| Treasury | 25% | DAO controlled |
| Team | 15% | 2 năm, 6 tháng cliff |
| Investors | 10% | 1 năm, 3 tháng cliff |
| Liquidity | 5% | Immediate |
| Advisors | 5% | 1 năm linear |
| **Total Supply** | **1,000,000,000 $MEMEORG** | |

---

## 5. YÊU CẦU SWAP AGGREGATOR

### 5.1. Fee Structure (BẮT BUỘC)

| Loại Token | Phí | DAO Share |
|------------|-----|-----------|
| Verified (Culture Seal) | 0.1% | 80% |
| Unverified | 0.3% | 80% |
| New/Risky | 0.5% | 80% |

### 5.2. MEV Protection (BẮT BUỘC)

| Priority | Phương pháp |
|----------|-------------|
| Default | Jito bundles |
| Alternative | Priority fees |
| Standard | Direct RPC |

**Slippage tolerance BẮT BUỘC trên mọi giao dịch**

### 5.3. Recommended Slippage

| Điều kiện thị trường | Slippage đề xuất |
|----------------------|------------------|
| High liquidity | 0.5% |
| Medium liquidity | 1-2% |
| Low liquidity meme coins | 5-10% |
| New launches | 10-15% |

### 5.4. Error Codes (BẮT BUỘC)

| Code | Mô tả |
|------|-------|
| `INSUFFICIENT_LIQUIDITY` | Không đủ thanh khoản |
| `SLIPPAGE_EXCEEDED` | Vượt ngưỡng slippage |
| `TOKEN_FROZEN` | Token bị đóng băng |
| `ROUTE_NOT_FOUND` | Không tìm được route |
| `QUOTE_EXPIRED` | Quote hết hạn |
| `SIGNATURE_INVALID` | Chữ ký không hợp lệ |

### 5.5. Integration Points (BẮT BUỘC)

- [ ] Jupiter API - Route aggregation
- [ ] Jito Block Engine - MEV protection
- [ ] Helius RPC - Transaction submission
- [ ] Privy SDK - Wallet connection

---

## 6. YÊU CẦU SOCIALFI & CURATOR

### 6.1. Curator Tier System (BẮT BUỘC)

| Tier | Points | Approval Rate | Multiplier |
|------|--------|---------------|------------|
| Bronze | 0-500 | Any | 1x |
| Silver | 501-2,000 | >60% | 1.25x |
| Gold | 2,001-5,000 | >70% | 1.5x |
| Platinum | 5,001-15,000 | >80% | 2x |
| Diamond | 15,000+ | >85% | 3x |

### 6.2. Contribution Points (BẮT BUỘC)

| Hoạt động | Điểm cơ bản | Quality Multiplier |
|-----------|-------------|-------------------|
| Meme Submission | 50 | 1-2x |
| Wiki Edit | 20 | 1-3x |
| Verification Vote (đúng) | 30 | 1.5x nếu vote sớm |
| Genealogy Link | 40 | 2x nếu verified |
| Image Upload | 10 | |

### 6.3. KOL Application Requirements (BẮT BUỘC)

| Điều kiện | Yêu cầu |
|-----------|---------|
| Account age | > 30 ngày |
| Meme contributions | > 5 approved |
| Reputation score | > 100 |
| Verification votes | > 10 (>60% accuracy) |
| Social proof | Twitter/X linked, 1,000+ followers |

### 6.4. KOL Exclusive Content Tiers (BẮT BUỘC)

| Tier | Keys Required |
|------|---------------|
| Basic | 1 Key |
| Premium | 3 Keys |
| VIP | 10 Keys |

### 6.5. Curator Reward Formula (BẮT BUỘC)

```
curator_reward = base_reward * (curator_stake_weight / total_correct_stake_weight) * tier_multiplier

Trong đó:
- base_reward = submission_fee * 0.8 (80% cho curators)
- tier_multiplier = {novice: 1, contributor: 1.2, expert: 1.5, master: 2.0}
```

---

## 7. YÊU CẦU PROOF-OF-CULTURE

### 7.1. Verification Thresholds (BẮT BUỘC)

| Parameter | Giá trị | Mô tả |
|-----------|---------|-------|
| MIN_SECURITY_SCORE | 40 | Dưới mức này → auto-reject |
| MIN_CURATOR_STAKE | 1,000 $MEMEORG | Minimum stake để vote |
| QUORUM_PERCENTAGE | 10% | % active curators cần thiết |
| APPROVAL_THRESHOLD | 70% | % positive votes để approve |
| VOTING_PERIOD | 7 ngày | Thời gian voting |
| STAKE_COOLDOWN | 7 ngày | Thời gian chờ unstake |
| SUBMISSION_FEE | 50 $MEMEORG | Phí submit verification |

### 7.2. Curator Tiers (BẮT BUỘC)

| Tier | Votes Required | Accuracy | Vote Weight |
|------|----------------|----------|-------------|
| Novice | 0-50 | Any | 1x |
| Contributor | 51-200 | >60% | 1.5x |
| Expert | 201-500 | >70% | 2x |
| Master | 500+ | >80% | 3x |

### 7.3. Auto-Rejection Rules (BẮT BUỘC)

| Điều kiện | Kết quả |
|-----------|---------|
| Security score < 40 | **AUTO-REJECT** |
| Honeypot detected | **AUTO-REJECT** |
| Timeout không đủ approval | REJECTED |

### 7.4. Culture Seal Requirements (BẮT BUỘC)

| Yêu cầu | Chi tiết |
|---------|----------|
| Storage | On-chain via Arweave + Solana |
| Expiry | KHÔNG hết hạn (permanent) |
| Metadata | version, type, meme, verification, seal, curators |

---

## 8. YÊU CẦU PHI CHỨC NĂNG

### 8.1. Performance Targets (BẮT BUỘC)

| Metric | Target |
|--------|--------|
| API latency (P95) | < 100ms |
| Search queries | < 200ms |
| Genealogy rendering | < 500ms |
| Key price queries | < 50ms |
| Page load (SSR) | < 1 giây |

### 8.2. Scalability Requirements (BẮT BUỘC)

| Metric | Target |
|--------|--------|
| Requests per second | 10,000+ |
| Concurrent WebSocket | 50,000+ |
| Daily swaps | 100,000+ |
| Active API keys | 100,000+ |
| Monitored tokens | 50,000+ |

### 8.3. Security Requirements (BẮT BUỘC)

| Yêu cầu | Chi tiết |
|---------|----------|
| API keys | Hash bằng bcrypt |
| Transport | TLS 1.3 minimum |
| Rate limiting | Per-key VÀ per-IP |
| Input validation | Strict schema validation |
| Data encryption | At rest VÀ in transit |

### 8.4. Availability Targets (BẮT BUỘC)

| Service | SLA |
|---------|-----|
| Free tier | Best effort |
| Developer | 99.5% |
| Professional | 99.9% |
| Enterprise | 99.99% |
| Blockchain Programs | 99.99% (phụ thuộc Solana) |

---

## CHECKLIST TUÂN THỦ

### API & Security
- [ ] API keys được hash bằng bcrypt
- [ ] TLS 1.3 cho mọi transport
- [ ] Rate limiting per-key VÀ per-IP
- [ ] HMAC-SHA256 cho webhooks
- [ ] Strict schema validation

### Rug-Check
- [ ] 100-point scoring algorithm
- [ ] Auto-reject cho honeypot
- [ ] Honeypot detection via simulation
- [ ] Holder concentration analysis

### KOL Keys
- [ ] Bonding curve formula: `price = base * (supply² / divisor)`
- [ ] 10% total fee (5% KOL + 5% Platform)
- [ ] Slippage protection trên mọi trade

### DAO
- [ ] 4% quorum
- [ ] 50% + 1 approval threshold
- [ ] 48h timelock (6h emergency)
- [ ] Multi-sig 3/5 cho treasury

### Swap
- [ ] Fee theo verification status
- [ ] MEV protection mặc định
- [ ] Slippage tolerance bắt buộc

### SocialFi
- [ ] 5-tier curator system
- [ ] 80% rewards cho curators
- [ ] KOL requirements verification

### Proof-of-Culture
- [ ] 40 minimum security score
- [ ] 70% approval threshold
- [ ] 7-day voting period
- [ ] Permanent Culture Seal

### Non-Functional
- [ ] P95 latency < 100ms
- [ ] 10,000+ RPS capacity
- [ ] 99.9%+ uptime cho paid tiers

---

## NGUỒN THAM CHIẾU

Tài liệu này được tổng hợp từ:

1. [HLD-CM-PREMIUM-API.md](../HLD/CryptoMeme/Features/HLD-CM-PREMIUM-API.md)
2. [HLD-CM-RUG-CHECK.md](../HLD/CryptoMeme/Features/HLD-CM-RUG-CHECK.md)
3. [HLD-CM-KOL-KEYS.md](../HLD/CryptoMeme/Features/HLD-CM-KOL-KEYS.md)
4. [HLD-CM-DAO-GOVERNANCE.md](../HLD/CryptoMeme/Features/HLD-CM-DAO-GOVERNANCE.md)
5. [HLD-CM-SWAP-AGGREGATOR.md](../HLD/CryptoMeme/Features/HLD-CM-SWAP-AGGREGATOR.md)
6. [HLD-CM-SOCIALFI.md](../HLD/CryptoMeme/Core/HLD-CM-SOCIALFI.md)
7. [HLD-CM-PROOF-OF-CULTURE.md](../HLD/CryptoMeme/Core/HLD-CM-PROOF-OF-CULTURE.md)

---

> **Lưu ý:** Tài liệu này cần được cập nhật mỗi khi có thay đổi trong các HLD tham chiếu.
>
> **Last Updated:** 2026-01-08
