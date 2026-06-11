# Kế hoạch cải tiến UI/UX — Spiral Meme Gallery

> Ngày lập: 2026-06-11 · Đang thực hiện tuần tự Phase 1 → 2 → 3
> Phạm vi: frontend hiện tại (React 18 + Three.js + Tailwind), bám theo vision MemePedia trong `Design/BusinessContextVision.md` và `docs/HLD.md`.

## Chẩn đoán hiện trạng

1. **Không dùng được trên mobile** — điều khiển hoàn toàn bằng WASD, không có touch control; HUD không responsive.
2. **Tính năng "ma"** — nút MENU không có handler; hint phím `/` nhưng không có search; `showMinimap`/`showLeaderboard` trong store chưa implement.
3. **Onboarding kém** — người mới không biết phải làm gì.
4. **Loading/error/empty state thô** — raw error message, không có empty state.
5. **Khó tìm token cụ thể** — không search, không minimap, không biết mình đang ở đâu.
6. **Accessibility & contrast** — thiếu ARIA, font khai báo nhưng chưa import, text xám khó đọc.
7. **Hiệu năng** — 100 card render mọi frame, không lazy load (→ Phase 4).

---

## ✅ Checklist thực hiện

### Phase 1 — Quick wins: không còn nút chết, không còn trạng thái thô

- [x] **1.1** Implement nút MENU → panel trượt: điều hướng (Search, Token List, Back to top), settings (Minimap, Controls guide), thông tin app → `src/components/UI/MenuPanel.tsx`
- [x] **1.2** Implement search `/`: overlay input, lọc theo tên/symbol real-time, ↑↓ chọn, Enter teleport đến token → `src/components/UI/SearchOverlay.tsx`
- [x] **1.3** Sửa modal TokenDetailPanel: ESC ưu tiên đúng (không mở menu kèm), click backdrop để đóng, focus vào nút close, animation mở
- [x] **1.4** Loading/error/empty state tử tế: error message thân thiện + nút Retry, empty state khi API trả rỗng
- [x] **1.5** Import font thật (Inter + JetBrains Mono), meta description, theme-color
- [x] **1.6** Gỡ dead flag `showLeaderboard` + phím L (minimap giữ lại — làm thật ở Phase 3)
- [x] **1.7** (phát hiện thêm) Gõ phím trong input không được làm nhân vật di chuyển; overlay mở thì khoá WASD/Enter

### Phase 2 — Mobile & accessibility

- [x] **2.1** Virtual joystick cho touch (tự viết, không thêm dependency) + tap token trong 3D để chọn + tap TokenPreview để mở chi tiết → `src/components/UI/TouchControls.tsx`, `src/utils/inputState.ts`
- [x] **2.2** Responsive HUD: title/preview thu gọn trên mobile, ControlsGuide ẩn trên thiết bị touch (thay bằng hint cử chỉ)
- [x] **2.3** List View 2D: grid token cổ điển toggle từ MENU — search + sort (rank/giá/24h/mcap), click mở chi tiết + teleport; là đường accessibility & máy yếu → `src/components/UI/ListView.tsx`
- [x] **2.4** A11y: ARIA label cho buttons, role="dialog" cho modal, `prefers-reduced-motion`, nâng contrast text phụ

### Phase 3 — Điều hướng & khám phá

- [x] **3.1** Minimap: bản đồ xoắn ốc 2D (SVG), chấm token màu pump/dump, chấm vị trí người chơi, click để fast-travel, phím M bật/tắt → `src/components/UI/Minimap.tsx`
- [x] **3.2** Chỉ báo vị trí trên HUD: tầng hiện tại (Level x/6) + token gần nhất
- [x] **3.3** Onboarding tour 3 bước lần đầu vào, lưu `hasSeenTour` (persist Zustand vào localStorage cùng settings) → `src/components/UI/Onboarding.tsx`
- [x] **3.4** Cải tiến TokenDetailPanel: sparkline có gradient + tooltip giá khi hover + min/max, tooltip giá trị đầy đủ cho số rút gọn
- [x] **3.5** Hover/selection mượt trong 3D: scale có easing (lerp) thay vì nhảy tức thì

### Phase 4 — Hiệu năng

- [x] **4.1** Lazy load texture ảnh token theo khoảng cách (chỉ fetch khi người chơi lại gần <35 đơn vị), placeholder branded hiện ký tự symbol thay vì "$" generic
- [x] **4.2** LOD: token xa (>18 đơn vị) không render text label (giảm ~300 text mesh), texture/label bật dần khi lại gần; check khoảng cách throttle 0.25s có lệch pha
- [x] **4.3** Adaptive quality: đo FPS mỗi giây, auto hạ chất lượng khi <40fps (tắt Bloom/Vignette, giảm Stars, DPR=1), nâng lại khi >55fps ổn định 5s; chọn Auto/High/Low trong MENU (persist) → `src/components/Scene/PerformanceMonitor.tsx`
- [x] **4.4** Persist vị trí nhân vật (lưu khi rời trang/ẩn tab — không ghi localStorage mỗi frame) + persist performance mode

### Bổ sung ngoài plan

- [x] Config ESLint 9 flat config (`eslint.config.js`) — repo trước đó không lint được; sửa 8 lỗi lint có sẵn

### Phase 5 — Hướng MemePedia

- [x] **5.1** Trang chi tiết mở rộng: mô tả/nguồn gốc token (CoinGecko `/coins/{id}` — hook `useTokenDetail` có sẵn nay mới được dùng), links Website/Twitter/Telegram/Reddit, community stats (followers), skeleton khi đang tải
- [x] **5.2** Leaderboard 24h: top 5 gainers + top 5 losers, click để bay đến token, phím L hoặc từ MENU → `src/components/UI/Leaderboard.tsx`
- [x] **5.3** Watchlist cá nhân: nút ★ trong detail panel + card ListView, filter "chỉ xem watchlist", persist localStorage (chuẩn bị cho account sau)
- [x] **5.4** Badge "◈ Culture Seal: pending" placeholder cho Proof-of-Culture (tooltip giải thích)
- [x] **5.5** Deep link `#/token/:id`: mở thẳng token từ URL, hash sync với token đang chọn — nền cho route SSR `/token/:id` (NextJS) về sau → `src/hooks/useTokenDeepLink.ts`

> Phần còn lại của vision MemePedia (genealogy Neo4j, SSR/NextJS, account đồng bộ watchlist) thuộc kiến trúc backend trong `Design/ComponentView.md`, ngoài phạm vi frontend MVP này.

---

Nguyên tắc: mỗi tính năng đủ 4 trạng thái loading/empty/error/success; không ship nút không hoạt động; neon chỉ dùng cho điểm nhấn.
