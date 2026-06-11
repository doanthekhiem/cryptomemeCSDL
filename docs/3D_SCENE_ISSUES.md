# Vấn đề không gian 3D — tóm tắt đánh giá

> Ngày đánh giá: 2026-06-11 · Kế hoạch xử lý chi tiết: Phase 6 trong [UIUX_IMPROVEMENT_PLAN.md](UIUX_IMPROVEMENT_PLAN.md)
>
> ✅ **ĐÃ XỬ LÝ (2026-06-11):** toàn bộ Phase 6 + định hướng meme M1–M4 đã triển khai theo thứ tự M4 → M1 → M3 → M2. Chi tiết từng hạng mục xem checklist Phase 6 trong plan. Lưu ý triển khai: Mặt Trăng đặt **lệch trục ở chân trời** (không thẳng trên đỉnh) vì camera third-person luôn chúc xuống ~17°, vật thể trên cao quá ~13° elevation không bao giờ lọt khung hình.

## 1. Không gian bảo tàng trống trơn, không đặc sắc

**File:** `src/components/Scene/SpiralStructure.tsx`, `SceneLighting.tsx`

- Toàn bộ "bảo tàng" chỉ có 4 mesh: ramp + 2 tường + 1 cột cylinder trơn.
- Material màu phẳng (`#2a3a5a`, `#1e2d4a`), emissive yếu (0.02–0.03), không texture, không chi tiết.
- Không có đèn trưng bày, bục, dầm, vòm — không có yếu tố kiến trúc lặp lại tạo nhịp điệu khi đi bộ.
- Nền trời đen tuyền chỉ có sao, thiếu chiều sâu.

→ Cảm giác như hành lang bê tông, không phải gallery.

## 2. Bài trí hiện vật đơn điệu, không phân cấp

**File:** `src/components/Scene/TokenFrame.tsx`

- 100 token frame giống hệt nhau: 1 box + 1 plane + ảnh tròn + 3 dòng text.
- Token rank #1 trông y hệt token #100 — không có "hiện vật chính" của bảo tàng.
- Không bục đế, không đèn rọi, không hiệu ứng trạng thái (pump/dump chỉ đổi màu viền).

## 3. Nhân vật tẻ nhạt

**File:** `src/components/Scene/PlayerCharacter.tsx`

- Là đám 500 hạt tĩnh xếp hình người mờ, sinh ra một lần rồi đứng yên.
- Animation duy nhất: scale "thở" ±2%. Không vung tay, không bước chân, không có sức sống.

## 4. Không có hiệu ứng di chuyển

**File:** `PlayerCharacter.tsx`, `ThirdPersonCamera.tsx`, `galleryStore.ts`

- Đi bộ = thay đổi toạ độ khô khan: không bob lên xuống, không nghiêng người khi rẽ.
- Không trail, không bụi; camera FOV cố định → không có cảm giác tốc độ.
- Teleport (search/minimap) nhảy cụt, không có transition/hiệu ứng nào.

## Hướng xử lý (Phase 6 — đã lên plan, chưa làm)

| # | Nhóm | Giải pháp chính |
|---|------|-----------------|
| 6.1 | Môi trường | Dải neon mép ramp, grid sàn, data column (torus + hạt bay), dầm neon mỗi 60°, nền nebula |
| 6.2 | Hiện vật | Bục + đèn rọi mỗi frame, vòng hologram, top 10 = hall of fame (frame to, viền gold), hạt pump/dump |
| 6.3 | Nhân vật | Energy core pulse + 2 ring hologram xoay + hạt quỹ đạo; walk cycle bob/lean, xoay damp |
| 6.4 | Di chuyển | Particle trail, FOV nở khi đi, burst effect khi teleport, bụi ambient |

**Ràng buộc:** hiệu ứng gate theo `effectiveQuality` (không phá adaptive quality Phase 4); chỉ dùng primitive + shader procedural, không thêm asset GLTF/dependency.

**Thứ tự đề xuất:** 6.3 + 6.4 trước (người dùng nhìn nhân vật 100% thời gian) → 6.1 → 6.2.

---

## Đề xuất định hướng nghệ thuật: PHONG CÁCH MEME 🚀

Vấn đề gốc về art direction: không gian hiện tại là **cyberpunk generic** — nghiêm túc, lạnh, không liên quan gì đến văn hoá meme. Đây là trang về **crypto meme**: trải nghiệm phải vui, tự giễu, đậm chất văn hoá degen. Đề xuất đổi narrative:

> **"Hành trình TO THE MOON"** — xoắn ốc không phải hành lang bảo tàng, mà là con đường leo từ Trái Đất lên Mặt Trăng. Càng lên cao rank càng cao; token #1 ngồi sát Mặt Trăng.

### M1 — Không gian "To The Moon" (thay thế concept 6.1)
- **Mặt Trăng** lớn phát sáng lơ lửng trên đỉnh xoắn ốc (sphere + glow), **Trái Đất** nhỏ phía dưới đáy — leo từ Earth tới Moon đúng nghĩa đen
- Dải mép ramp = **rainbow road** đổi màu cầu vồng chạy (nyan cat vibe) thay vì neon cyan đơn sắc
- Tường gắn dãy **nến chart xanh/đỏ** phát sáng (candlestick làm vật liệu kiến trúc) thay dầm neon thường
- Billboard hologram quanh cột trung tâm chạy **ticker meme**: "HODL" · "WAGMI" · "wen lambo" · "💎🙌 diamond hands" + giá thật từ API
- Biển neon khu vực: cụm token đang pump = "**PUMP ZONE**", cụm đang dump = "**REKT ALLEY**"

### M2 — Hiện vật meme (bổ sung 6.2)
- Token pump >10%: **rocket mini 🚀 bay vòng quanh frame** kéo trail lửa; dump <−10%: hạt đỏ rỉ xuống + emoji 📉/💀 nổi lên
- Frame **#1 đội vương miện 👑** + confetti rơi nhẹ liên tục; top 10 bục vàng
- Ambient particles = **emoji sprites** (🚀 💎 🐸 🐕 🔥 📈) trôi lơ lửng thay bụi thường — *kỹ thuật: vẽ emoji lên canvas → texture sprite, không cần asset ngoài*

### M3 — Nhân vật degen (bổ sung 6.3)
- Energy core + **helmet phi hành gia** (sphere kính trong suốt) — astronaut đi tìm moon
- Chạy để lại **trail cầu vồng** kiểu nyan cat
- Đứng yên >10s: emoji 💤 nổi lên đầu (idle hài); chạm token pump mạnh: nhân vật nảy lên ăn mừng

### M4 — Khoảnh khắc meme trong UI (rẻ, hiệu quả cao)
- Mở modal token đang pump >20%: stamp "**🚀 TO THE MOON**" xoay nghiêng + confetti một nhịp
- Loading screen xoay vòng caption: "Summoning doge…", "Mining copium…", "Asking wen lambo…", "Counting diamond hands…"
- Empty/error state: "no memes? 🐸" thay vì thông báo khô khan
- Onboarding tour viết lại giọng degen: "Anon, welcome to the spiral. WAGMI."

### Nguyên tắc an toàn
- Chỉ dùng **emoji Unicode + chữ + logo token từ API** — không vẽ lại Doge/Pepe (tránh vấn đề bản quyền hình tượng)
- Meme ở **lớp trang trí và copywriting**, dữ liệu giá/market cap vẫn hiển thị nghiêm túc, dễ đọc — vui nhưng không phá tin cậy
- Vẫn giữ ràng buộc Phase 6: gate theo `effectiveQuality`, không thêm dependency

**Ưu tiên đề xuất:** M4 (1 buổi, đổi cảm giác toàn trang ngay) → M1 (moon + rainbow road là "wow moment") → M3 → M2.
