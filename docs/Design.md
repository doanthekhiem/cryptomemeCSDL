# Design Document: Spiral Meme Token Gallery

## 1. Tổng Quan

### 1.1 Mô Tả Dự Án

**Spiral Meme Token Gallery** là một trải nghiệm 3D tương tác, nơi người dùng có thể khám phá thế giới meme coins trong không gian thư viện xoắn ốc (spiral library). Người dùng điều khiển nhân vật di chuyển dọc theo đường xoắn ốc, hai bên tường hiển thị các token meme được sắp xếp theo Market Cap từ lớn đến nhỏ.

### 1.2 Concept Chính

- **Không gian**: Thư viện dạng tháp xoắn ốc (như Guggenheim Museum)
- **Trải nghiệm**: Third-person 3D exploration
- **Nội dung**: Real-time meme token data từ CoinGecko API
- **Narrative**: Đi từ đỉnh (top mcap) xuống đáy (low mcap) như hành trình khám phá

### 1.3 User Preferences

- **Hướng di chuyển**: Đỉnh → Đáy (bắt đầu với top mcap tokens như DOGE, SHIB)
- **Visual Style**: Cyberpunk/Neon (màu tối + neon glow, futuristic)
- **Character**: Particle/Fuzzy character (giữ style từ bản gốc)

### 1.4 Target Users

- Crypto enthusiasts muốn trải nghiệm mới lạ
- Meme coin traders tìm kiếm tokens
- Người tò mò về thế giới crypto/meme coins

---

## 2. Thiết Kế Không Gian 3D

### 2.1 Cấu Trúc Spiral Library

```
        ╭───────────╮  ← Đỉnh (Top MCap tokens: DOGE, SHIB, PEPE)
       ╱             ╲
      │   ☀ LIGHT    │  ← Skylight ở trung tâm
      │               │
     ╱                 ╲
    │  ┌─────┐ ┌─────┐  │  ← Token frames trên tường
    │  │DOGE │ │PEPE │  │
   ╱   └─────┘ └─────┘   ╲
  │                       │
  │    [CHARACTER] →      │  ← Nhân vật di chuyển trên ramp
 ╱                         ╲
│   ┌─────┐ ┌─────┐ ┌─────┐ │
│   │TOKEN│ │TOKEN│ │TOKEN│ │  ← Nhiều token hơn khi đi xuống
╰───┴─────┴─┴─────┴─┴─────┴─╯  ← Đáy (Low MCap tokens)
```

### 2.2 Thông Số Spiral

| Parameter | Value | Mô tả |
|-----------|-------|-------|
| Số vòng xoắn | 5-7 vòng | Đủ space cho ~100-200 tokens |
| Bán kính trong | 8 units | Không gian trống ở giữa |
| Bán kính ngoài | 25 units | Tường ngoài của spiral |
| Chiều rộng ramp | 6 units | Đường đi của nhân vật |
| Chiều cao mỗi vòng | 4 units | Khoảng cách giữa các level |
| Tổng chiều cao | 20-28 units | Từ đáy đến đỉnh |

### 2.3 Layout Token Frames

**Tường trong (Inner Wall):**

- Facing outward (nhìn ra ngoài)
- Token frames cách nhau 3 units
- Spotlight chiếu từ trên xuống

**Tường ngoài (Outer Wall):**

- Facing inward (nhìn vào trong)
- Token frames cách nhau 3 units
- Có thể thêm nhiều tokens hơn (chu vi lớn hơn)

### 2.4 Sắp Xếp Token Theo MCap

```
LEVEL 1 (Đỉnh):     #1 DOGE, #2 SHIB, #3 PEPE, #4 BONK...
    ↓ đi xuống
LEVEL 2:            #11-20
    ↓
LEVEL 3:            #21-30
    ↓
...
LEVEL N (Đáy):      Low cap meme tokens
```

---

## 3. Thiết Kế Token Display

### 3.1 Token Card/Frame

```
┌──────────────────────────────┐
│  ┌────────────────────────┐  │
│  │                        │  │
│  │      DOGE LOGO         │  │  ← Token logo (hình ảnh)
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  DOGECOIN                    │  ← Token name
│  $0.12345                    │  ← Current price
│  MCap: $18.5B                │  ← Market cap
│  24h: +5.2%                  │  ← 24h change
│                              │
└──────────────────────────────┘
    Frame size: 2.5 x 3.5 units
```

### 3.2 Visual States

| State | Visual Effect |
|-------|---------------|
| Default | Soft neon glow, neutral frame |
| Hover/Near | Brighter glow, frame highlight, cyan outline |
| Pumping (>10%) | Green pulsing glow |
| Dumping (<-10%) | Red pulsing glow |
| Selected | Zoom in, detail panel appears |

### 3.3 Detail View Panel

Khi nhấn Enter gần token:

- Camera zoom vào token
- Panel chi tiết xuất hiện với:
  - Full token info
  - Price chart (7 ngày) - sparkline
  - Volume 24h
  - All-time high/low
  - Link đến CoinGecko
  - Social links (Twitter, Telegram)

---

## 4. Thiết Kế Nhân Vật & Camera

### 4.1 Particle Character

- **Style**: Particle/Fuzzy character (2000-5000 particles)
- **Color**: Dark với neon glow edges
- **Di chuyển**: Đi bộ trên ramp xoắn ốc
- **Animation**: Idle (particles drifting), Walking (particles flowing), Looking at token

```typescript
interface ParticleCharacterConfig {
  particleCount: 3000;
  particleSize: 0.03;
  color: '#00fff5';       // Neon cyan
  glowColor: '#ff00ff';   // Neon magenta accent
  movementSpeed: 4;       // units/sec
  rotationSpeed: 3;       // rad/sec
}
```

### 4.2 Camera System

- **Mode**: Third-person follow
- **Position**: Behind and above character (offset: [0, 3, 8])
- **Smoothing**: Lerp interpolation (factor: 0.1)
- **Special**: Khi nhìn token, camera tự động angle để frame token

### 4.3 Controls

```
↑/W     : Đi tới (theo hướng ramp)
↓/S     : Đi lùi
←/A     : Quay trái
→/D     : Quay phải
Enter   : Xem chi tiết token gần nhất
ESC     : Menu / Quay lại
Scroll  : Zoom camera in/out
L       : Toggle Leaderboard
M       : Toggle Minimap
/       : Open Search
```

---

## 5. UI/UX Design

### 5.1 HUD Elements

```
┌─────────────────────────────────────────────────────┐
│ [SEARCH /]                               [MENU ☰]  │
│                                                     │
│ ┌─────────┐                                         │
│ │ MINIMAP │                                         │
│ │  ╭───╮  │                                         │
│ │ ╱  ●  ╲ │                                         │
│ │ ╲     ╱ │           3D SCENE                      │
│ │  ╰───╯  │                                         │
│ └─────────┘                                         │
│                                                     │
│ ┌─────────────┐                                     │
│ │ Nearest:    │                                     │
│ │ DOGE        │     ┌──────────────────────────┐   │
│ │ $0.123      │     │  ↑ Move  │ Enter: Detail │   │
│ │ Press Enter │     │  ← →     │  ESC: Back    │   │
│ └─────────────┘     └──────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 5.2 Mini-map

```
┌─────────┐
│  ╭───╮  │  Hiển thị vị trí hiện tại
│ ╱  ●  ╲ │  trong spiral (● = you)
│ ╲     ╱ │  Gradient màu theo level
│  ╰───╯  │
└─────────┘
```

### 5.3 Leaderboard Quick View

- Toggle với phím L
- Hiển thị Top 10 meme tokens
- Glow effect cho pumping tokens
- Click để teleport đến vị trí token

### 5.4 Search Modal

- Activate với phím /
- Fuzzy search by name/symbol
- Results show token + current price
- Enter để teleport đến token

---

## 6. Visual Style - Cyberpunk/Neon

### 6.1 Color Palette

```
Primary Background:   #0a0a0f (Deep black-blue)
Secondary Background: #1a1a2e (Dark purple)
Tertiary:             #16213e (Navy blue)

Neon Cyan:            #00fff5 (Primary accent)
Neon Magenta:         #ff00ff (Secondary accent)
Neon Purple:          #bf00ff (Tertiary accent)

Gold (Top tokens):    #ffd700
Positive (Pump):      #00ff88
Negative (Dump):      #ff4757

Text Primary:         #ffffff
Text Secondary:       #a0a0a0
```

### 6.2 Lighting

```typescript
const lightingConfig = {
  // Skylight từ đỉnh
  skylight: {
    color: '#ffffff',
    intensity: 0.5,
    position: [0, 50, 0]
  },

  // Ambient
  ambient: {
    color: '#1a1a2e',
    intensity: 0.3
  },

  // Neon strips dọc ramp
  neonStrips: {
    color: '#00fff5',
    intensity: 0.8,
    emissive: true
  },

  // Token spotlights
  tokenSpots: {
    color: '#ffffff',
    intensity: 0.6,
    angle: Math.PI / 6
  }
};
```

### 6.3 Atmosphere & Effects

- **Fog**: Gradient fog từ đáy lên, màu deep purple
- **Particles**: Floating dust/sparkles trong không gian
- **Bloom**: Post-processing bloom cho neon elements
- **Grid lines**: Subtle grid pattern trên sàn và tường
- **Stars**: Visible qua skylight opening

### 6.4 Material Specs

```typescript
// Ramp/Floor material
const rampMaterial = {
  color: '#1a1a2e',
  metalness: 0.3,
  roughness: 0.7,
  emissive: '#0a0a0f',
  emissiveIntensity: 0.1
};

// Wall material
const wallMaterial = {
  color: '#16213e',
  metalness: 0.2,
  roughness: 0.8,
  normalMap: 'subtle-pattern'
};

// Token frame material
const frameMaterial = {
  color: '#2a2a3e',
  metalness: 0.5,
  roughness: 0.3,
  emissive: '#00fff5',
  emissiveIntensity: 0.2
};
```

---

## 7. Interaction Design

### 7.1 Proximity Zones

```
Token interaction zone: 3 units radius
- Enter zone: Show token preview card
- Exit zone: Hide preview
- Press Enter in zone: Full detail view
```

### 7.2 Camera Transitions

| Action | Transition |
|--------|------------|
| Enter detail view | 0.5s ease-out zoom to token |
| Exit detail view | 0.3s ease-in return to follow |
| Teleport | 1s smooth fly-through |

### 7.3 Feedback Systems

- **Sound**: Subtle UI sounds (optional)
- **Visual**: Glow pulse on interaction
- **Haptic**: Browser vibration API (mobile)

---

## 8. Responsive Design

### 8.1 Desktop (Primary)

- Full keyboard controls
- Mouse for camera orbit (optional)
- All UI elements visible

### 8.2 Mobile/Tablet

- Virtual joystick for movement
- Tap on token for details
- Simplified HUD
- Gyroscope camera control (optional)

---

## 9. Audio Design (Optional)

### 9.1 Ambient

- Lo-fi electronic/synthwave background
- Volume: Low, atmospheric
- Tempo: Slow, relaxing

### 9.2 SFX

```
- Footsteps: Soft, metallic
- Token hover: Subtle whoosh
- Detail open: Synth chime
- Pump alert: Rising arpeggio
- Dump alert: Descending tone
```

---

## 10. Loading & Onboarding

### 10.1 Loading Screen

```
┌─────────────────────────────────────┐
│                                     │
│      SPIRAL MEME TOKEN GALLERY      │
│                                     │
│         ▓▓▓▓▓▓▓▓░░░░░░ 65%         │
│                                     │
│      Loading token data...          │
│                                     │
└─────────────────────────────────────┘
```

### 10.2 First-time Tutorial

1. Welcome message
2. Controls overlay (3 seconds)
3. "Move to explore" prompt
4. First token interaction hint
5. Auto-dismiss after first interaction
