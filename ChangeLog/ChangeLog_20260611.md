# ChangeLog 2026-06-11 — UI/UX Improvement (Phase 1–3)

Thực hiện theo `docs/UIUX_IMPROVEMENT_PLAN.md`. Build pass (`tsc -b && vite build`).

## Phase 1 — Quick wins
- **MENU hoạt động**: panel trượt mới (`src/components/UI/MenuPanel.tsx`) — Search, Token List 2D, Back to top, toggle Minimap/Controls guide, thông tin app + attribution CoinGecko.
- **Search `/`**: overlay mới (`src/components/UI/SearchOverlay.tsx`) — lọc theo tên/symbol, ↑↓ + Enter để teleport đến token, hiển thị rank/giá/24h.
- **Modal chi tiết**: ESC giờ chỉ đóng overlay trên cùng (trước đây đóng modal kèm mở menu), click backdrop để đóng, focus vào nút close khi mở, animation slide-up, `role="dialog"`.
- **Loading/error/empty**: error message thân thiện (kèm technical detail nhỏ), thêm empty state khi API trả danh sách rỗng.
- **Fonts**: import Inter + JetBrains Mono (Google Fonts), thêm meta description + theme-color.
- **Dọn dead code**: gỡ `showLeaderboard`/`toggleLeaderboard`/phím L.
- **Input bug fix**: gõ trong input không còn làm nhân vật di chuyển; overlay mở thì khoá WASD/Enter.

## Phase 2 — Mobile & accessibility
- **Virtual joystick** (`TouchControls.tsx` + `src/utils/inputState.ts`): analog, tự viết không thêm dependency; movement loop nhận cả keyboard lẫn joystick.
- **Responsive HUD**: TokenPreview thành bottom bar full-width trên mobile (tap để mở chi tiết), title thu gọn, ControlsGuide đổi sang hint cử chỉ trên touch.
- **List View 2D** (`ListView.tsx`): grid token với filter + sort (rank/mcap/giá/top gainers/losers), click → teleport + mở chi tiết. Là đường accessibility/máy yếu.
- **A11y**: ARIA labels, `role="dialog"`/`aria-modal`, `prefers-reduced-motion`, nâng contrast text phụ (gray-400/500 → gray-300/400), `viewport-fit=cover` + safe-area.

## Phase 3 — Điều hướng & khám phá
- **Minimap** (`Minimap.tsx`): xoắn ốc "trải phẳng" (tâm = đáy, mép = đỉnh), chấm token màu pump/dump, chấm vị trí người chơi (pulse), click chấm để fast-travel, phím M bật/tắt.
- **Chỉ báo vị trí**: "Level x/6 · near #rank SYMBOL" trên HUD.
- **Onboarding tour** 3 bước lần đầu vào (`Onboarding.tsx`); `hasSeenTour` + settings persist vào localStorage (zustand persist, chỉ lưu preferences).
- **Sparkline nâng cấp**: gradient fill, crosshair + tooltip giá khi hover, label Low/High; tooltip giá trị đầy đủ cho Market Cap/Volume/ATH/ATL.
- **3D mượt hơn**: TokenFrame scale có easing (damp) thay vì nhảy tức thì; teleport giờ quay mặt nhân vật về phía token.

## Phase 4 — Hiệu năng
- **Lazy texture loading** (`TokenFrame.tsx`): ảnh token chỉ fetch khi người chơi vào bán kính 35 đơn vị (trước đây load cả 100 ảnh ngay khi vào trang); placeholder hiện ký tự symbol trong vòng neon thay vì "$" generic.
- **LOD theo khoảng cách**: token xa hơn 18 đơn vị không render 3 text label (symbol/giá/24h) — bớt ~300 text mesh mỗi frame; check khoảng cách throttle 0.25s, lệch pha ngẫu nhiên để 100 frame không check cùng lúc.
- **Adaptive quality** (`PerformanceMonitor.tsx` mới): đo FPS mỗi giây; chế độ Auto hạ xuống Low khi <40fps liên tục 2s (tắt EffectComposer Bloom/Vignette, Stars 3000→1200, DPR→1), nâng lại High khi >55fps ổn định 5s (hysteresis chống nhấp nháy). Chọn Auto/High/Low trong MENU, persist.
- **Persist vị trí**: lưu vị trí nhân vật vào localStorage khi rời trang/ẩn tab (event `pagehide`/`visibilitychange` — tránh ghi 60 lần/giây), validate khi khôi phục (phải nằm trên ramp xoắn ốc).

## ESLint
- Thêm `eslint.config.js` (ESLint 9 flat config: @eslint/js + typescript-eslint + react-hooks + react-refresh) — `npm run lint` trước đó fail vì thiếu config.
- Sửa 8 lỗi lint có sẵn: `no-case-declarations` trong `PlayerCharacter.tsx`, `prefer-const` trong `animation.ts` và `useKeyboardControls.ts`.

## Phase 5 — Hướng MemePedia
- **Trang chi tiết mở rộng**: section "About" với mô tả token (fetch lazy từ `/coins/{id}` qua hook `useTokenDetail` có sẵn, strip HTML, Read more khi dài), chips link Website/Twitter/Telegram/Reddit, community stats (Twitter/Reddit/Telegram followers), skeleton khi đang tải.
- **Leaderboard 24h** (`Leaderboard.tsx`): top 5 gainers + losers, click để teleport + mở chi tiết; phím L hoặc MENU.
- **Watchlist**: nút ★ trong detail panel và trên card ListView, filter "★ chỉ xem watchlist", lưu localStorage (persist cùng prefs).
- **Culture Seal placeholder**: badge "◈ Culture Seal: pending" trong detail panel — chỗ gắn hệ thống Proof-of-Culture sau này.
- **Deep link** (`useTokenDeepLink.ts`): URL `#/token/<id>` mở thẳng token (teleport + modal), hash sync 2 chiều với token đang chọn — share link được, là nền cho route SSR sau.

## Ghi chú
- Toàn bộ 5 phase trong `docs/UIUX_IMPROVEMENT_PLAN.md` đã hoàn thành ở mức frontend MVP.
- Bundle JS ~1.26MB (three.js chiếm phần lớn) — có thể code-split nếu cần sau.
- Lưu ý rate limit CoinGecko free tier: mỗi lần mở detail panel gọi thêm 1 request `/coins/{id}` (React Query cache 60s).

## Art pass 2 — sửa "trông khá tệ" (đánh giá từ screenshot/video thực tế)
Đánh giá từ `scennsot.png` + `video-record.mp4`: ánh sáng phẳng (ambient trắng 1.35 xóa hết tương phản), tường/sàn là mảng màu đơn sắc như blockout, nến chart trôi lơ lửng ngẫu nhiên, tường chắn ENTRANCE/SUMMIT trống trơn, nhân vật là quả cầu mờ.

- **Ánh sáng có tương phản** (`SceneLighting.tsx`): ambient 1.35 trắng → 0.45 xanh lạnh; hemisphere ấm trên/lạnh dưới (#ffe7c4 / #141b38); thêm directional fill lạnh phía đối diện — tường cong giờ có dải sáng-tối thay vì một màu bẹt.
- **Texture thủ tục cho tường & sàn** (`proceduralTextures.ts` + `SpiralStructure.tsx`): `getWallPanelTexture` (gradient wall-washer + khe panel + noise thạch cao, clone với repeat khác nhau cho tường trong/ngoài để panel ~2.5m đều nhau), `getFloorTexture` (đá tối lốm đốm + khe gạch + sheen) thay grid dev cũ.
- **Len chân tường + LED skirting**: 2 dải `createWallBandGeometry` chạy suốt 6 vòng ở chân cả hai tường — đường ngang liên tục cho cảm giác tỉ lệ và chiều sâu hành lang.
- **Nến chart thành biểu đồ thật**: random-walk liên tục (thân nến nối close trước → close sau, bias đi lên "to the moon"), walk vẫn tiến qua chỗ cửa sổ để chart liền mạch; nến to hơn (0.5) và emissive 0.85.
- **Cổng ENTRANCE/SUMMIT**: thêm vòng portal neon đôi (cyan/magenta ở entrance, gold ở summit) — tường cụt thành điểm đến.
- **Wall-wash bảo tàng** (`TokenFrame.tsx`): quầng sáng ấm additive sau mỗi khung tranh (vàng đậm hơn cho top-10), luôn hiển thị nên hành lang đọc thành dãy hiện vật được rọi đèn từ xa; thanh đèn rọi tranh chuyển từ LOD-gần sang luôn hiển thị.
- **Nhân vật phi hành gia rõ hình** (`PlayerCharacter.tsx`): bỏ capsule opacity 0.18 (nhìn như quả cầu trôi) → suit trắng đục, visor vàng gương, balo life-support, vạch boots cyan; lõi năng lượng chuyển thành chest reactor nhỏ.
- **Bloom bớt mờ ảo** (`Scene.tsx`): luminanceThreshold 0.1 → 0.4 (chỉ neon thật mới bloom — trước đó cả tường sáng cũng bị haze), dải đèn trần #cdbd96 → #6e6549 (hết vòng cung vàng lóa khổng lồ ở góc nhìn chéo).
- Kiểm chứng bằng pw-driver headless (6 góc chụp: entrance, hành lang, giữa xoắn ốc, summit) — không lỗi console, build + lint sạch.
