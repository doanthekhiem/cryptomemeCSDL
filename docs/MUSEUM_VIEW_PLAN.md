# Plan: Góc nhìn "trong lòng bảo tàng" (Phase 7)

> Ngày lập: 2026-06-11 · Trạng thái: **✅ ĐÃ TRIỂN KHAI** (2026-06-11, xem mục "Kết quả triển khai" cuối file)
> Yêu cầu gốc: *"Toàn bộ màn hình chỉ nằm trong bảo tàng, không nhìn ra ngoài bức tường. Các bức tranh meme phải sắp xếp đúng trải nghiệm đi xem bảo tàng — tranh treo dọc hai bên, cứ đi mãi, không bao giờ thoát ra khỏi bối cảnh."*

## Chẩn đoán (đo từ code hiện tại)

| # | Vấn đề | Số liệu | File |
|---|--------|---------|------|
| 1 | Camera **luôn cao hơn mép tường** → mọi vị trí đều nhìn vượt nóc tường ra ngoài | Nhân vật ở `ramp+1.5`, camera offset `[0, 4, 10]` → camera ở `ramp+5.5` > mép tường `ramp+4` (`wallHeight: 4`) | `constants.ts` |
| 2 | Camera **quá xa so với bề rộng hành lang** → văng ra ngoài tường khi rẽ/đứng lệch | Hành lang rộng 12 (r 8→20), camera lùi 10 đơn vị phía sau; teleport spawn cách frame 3 → camera gần như chắc chắn xuyên tường | `ThirdPersonCamera.tsx` |
| 3 | **Không có ràng buộc/collision** cho camera — chỉ lerp tới điểm offset | — | `ThirdPersonCamera.tsx` |
| 4 | **Hở trần hoàn toàn**: dù camera có thấp, ngẩng nhìn theo độ dốc vẫn thấy nebula/sao/Moon | Không có geometry trần; `Stars`, `MoonAndSky` render full-sky | `Scene.tsx`, `MoonAndSky.tsx` |
| 5 | Camera chúc xuống ~17° (lookAt `+1`) → khung hình chủ yếu là **sàn**, không phải tranh | Tranh treo tâm `+2` so với chân | `constants.ts` |
| 6 | Tranh hai tường đặt **cùng góc, đối mặt nhau từng cặp** (inner/outer dùng chung công thức angleOffset) → nhịp "trái-phải-trái-phải" của hành lang bảo tàng không có | `calculateTokenPositions`: cả 2 tường đều `(wallPosition+0.5)/6·2π` | `tokenPositioning.ts` |
| 7 | Tranh **lệch cao độ so với ramp** tại vị trí treo: height dùng `wallPosition/6` nhưng angle dùng `(wallPosition+0.5)/6` → tranh thấp hơn chuẩn ~0.33, mỗi tranh một kiểu so với mặt sàn dốc | `tokenPositioning.ts` |

## Nguyên tắc chung

- **Không đổi gameplay**: điều khiển, LOD (`TEXTURE_DISTANCE 35` / `DETAIL_DISTANCE 18`), adaptive quality Phase 4, store API giữ nguyên.
- **Không raycast collision**: kiến trúc là hình trụ giải tích → ràng buộc camera bằng toán (clamp bán kính + cao độ), chi phí ≈ 0.
- Không thêm dependency/asset; geometry mới dùng lại pattern generator sẵn có.
- Mỗi bước có **tiêu chí nghiệm thu** chụp ảnh thật (headless Chromium như Phase 6).

---

## 7.1 — Camera "người đi xem tranh" (cốt lõi, làm trước)

**File:** `constants.ts`, `ThirdPersonCamera.tsx`

- [ ] Hạ thấp + kéo gần offset: `[0, 4, 10]` → `[0, 2.0, 5.0]` (camera ở `ramp+3.5`, dưới mép tường kể cả tường 4 hiện tại)
- [ ] Nâng tầm nhìn: `lookAtOffset` `+1` → `+1.7` — nhìn ngang tầm tranh (tâm tranh `+2`), pitch còn ~3–4°
- [ ] Clamp camera trong hành lang mỗi frame, **sau** khi lerp:
  - bán kính: `clamp(r_cam, innerRadius + 0.6, outerRadius − 0.6)`
  - cao độ: `clamp(y_cam, charY − 0.2, charY + 2.0)` (luôn dưới mép tường)
- [ ] Giới hạn `cameraZoom` max 2 → 1.3 (store clamp) — zoom xa nhất vẫn nằm trong hành lang
- [ ] Teleport: giữ camera-snap hiện có; vì offset chỉ còn 5 đơn vị + clamp nên không còn xuyên tường

**Nghiệm thu:** đứng sát tường ngoài quay 360°, rẽ gắt liên tục, teleport 5 token ngẫu nhiên — không frame nào thấy mặt sau tường (mảng đen) hoặc nhìn từ ngoài vào.

## 7.2 — Đóng kín bối cảnh: trần + nâng tường

**File:** `constants.ts`, `spiralGenerator.ts`, `SpiralStructure.tsx`

- [ ] Nâng `wallHeight` 4 → 5.5 (geometry tường/nến tự theo, tranh không đổi)
- [ ] Thêm **trần xoắn ốc**: ribbon nối mép trên tường trong–tường ngoài (copy pattern `createSpiralRampGeometry`, đặt tại `ramp + wallHeight`, normal hướng xuống). Material tối + emissive nhẹ, có **dải đèn trần** chạy giữa (tái dùng `createRampStripGeometry` lệch y) — đèn hắt kiểu gallery
- [ ] Bịt 2 đầu xoắn ốc (đáy turn 0 và đỉnh turn 6): vách chắn + biển neon "ENTRANCE 🌀" / "🌕 SUMMIT" để người chơi hiểu là điểm đầu/cuối chứ không phải lỗi
- [ ] Fog: kéo `far` 150 → ~60, đổi màu fog theo tông trong nhà (`#141a30`) — khúc cua xa mờ dần như chiều sâu hành lang thật, đồng thời là lưới an toàn che mọi khe hở nhỏ
- [ ] `Stars` + nebula: chỉ còn nhìn thấy qua cửa sổ (7.3) → render bình thường nhưng bị trần/tường che; nếu đo thấy tốn GPU vô ích trên low thì gate `Stars` theo quality (đã có sẵn count gate)

**Nghiệm thu:** sweep 360° tại đáy / giữa / đỉnh xoắn ốc + nhìn lên khi đi trên dốc — **0 pixel** nebula/sao/void lọt khung hình ngoài vùng cửa sổ 7.3.

## 7.3 — Cửa sổ "To The Moon" (giữ wow moment một cách có kiểm soát)

**File:** `SpiralStructure.tsx`, `MoonAndSky.tsx`

Đóng kín hoàn toàn sẽ mất narrative "leo lên Mặt Trăng" của Phase 6. Giải pháp bảo tàng thật: **ô cửa kính** — bên ngoài chỉ được thấy qua khung mà mình kiểm soát.

- [ ] 1–2 **ô cửa sổ lớn mỗi vòng** trên tường ngoài (khung neon + mặt kính mờ `opacity ~0.1`), đặt ở góc cố định thẳng hướng Mặt Trăng `[90, 32, -70]` — càng leo cao Moon càng lớn/ngang tầm mắt qua cửa sổ
- [ ] Kỹ thuật đục lỗ: tường ngoài generator thêm tham số "khoảng góc bỏ qua" (skip segment) thay vì stencil/CSG — rẻ và khớp pattern code sẵn có
- [ ] Trần tầng trên cùng: 1 **giếng trời (skylight)** tròn ngay dưới vị trí cao nhất — đứng ở đỉnh nhìn lên thấy trăng/sao, đúng cảm giác "đến nơi"
- [ ] Earth chỉ thấy qua cửa sổ thấp nhất (turn 0) — điểm khởi hành

**Nghiệm thu:** từ turn 1 và turn 6 đứng trước cửa sổ thấy Moon rõ; ngoài vùng cửa sổ không thấy bầu trời.

## 7.4 — Sắp xếp tranh meme theo nhịp bảo tàng

**File:** `tokenPositioning.ts` (thuật toán), `TokenFrame.tsx` (chỉ nếu cần chỉnh cao độ)

- [ ] **So le hai tường**: giữ 12 tranh/vòng nhưng tường ngoài lệch nửa bước góc (`+30°`) so với tường trong → đi 1 vòng gặp tranh xen kẽ trái–phải đều đặn mỗi ~30° (≈ 7 đơn vị đường đi) thay vì từng cặp đối mặt
- [ ] **Đồng bộ cao độ với ramp**: height dùng đúng góc treo `(wallPosition + 0.5)/6` (sửa lệch 0.33 hiện tại) → mọi tranh đều cách sàn đúng một khoảng, tâm tranh `+2.1` ≈ ngang `lookAt +1.7` mới
- [ ] **Thứ tự kể chuyện giữ nguyên**: rank #100 ở đáy → #1 trên đỉnh (đã đúng tinh thần "leo lên đỉnh"), kiểm tra lại sau khi so le không làm 2 token liền rank nhảy tường lộn xộn — quy tắc: rank chẵn tường trong, lẻ tường ngoài (hoặc giữ tuần tự 6-trong-6-ngoài nhưng so le góc)
- [ ] Hall of fame top 10 (Phase 6) nằm trọn vòng cuối — thêm **thảm đỏ**: đổi màu dải rainbow road đoạn vòng 6 sang gold-đỏ để báo hiệu khu trưng bày chính
- [ ] Kiểm tra `getTokenViewingPosition`/teleport vẫn đặt người chơi đối diện tranh sau khi đổi góc

**Nghiệm thu:** đi bộ liên tục 1 vòng giữa hành lang — tranh xuất hiện luân phiên trái/phải nhịp đều, tâm tranh nằm trong 1/3 giữa màn hình, không tranh nào chìm dưới sàn dốc hay treo hụt.

## 7.5 — Xác minh tổng thể

- [ ] Script headless (tái dùng `/tmp/pw-driver` pattern): teleport đáy → đi bộ hết 6 vòng tự động, chụp mỗi 90°, grep ảnh không có pixel nebula tím ngoài cửa sổ
- [ ] Kiểm tra low quality: trần/cửa sổ vẫn render (geometry là bối cảnh, **không** gate quality — chỉ hiệu ứng mới gate)
- [ ] FPS không giảm so với Phase 6 (trần thêm ~2 draw call, fog gần hơn còn *giảm* tải overdraw)
- [ ] Cập nhật minimap/tour nếu lời thoại nhắc tới bầu trời

## Thứ tự thực hiện & độ lớn

| Bước | Phạm vi | Ước lượng |
|------|---------|-----------|
| 7.1 Camera | 2 file, ~25 dòng | nhỏ — làm đầu tiên, giải quyết ~80% vấn đề |
| 7.2 Trần + tường | generator + structure | vừa |
| 7.4 Sắp xếp tranh | thuật toán positioning | vừa — làm ngay sau 7.1 vì phụ thuộc tầm mắt mới |
| 7.3 Cửa sổ | generator (skip segment) | vừa–lớn, làm cuối vì là polish narrative |
| 7.5 Verify | script sẵn có | nhỏ |

**Rủi ro cần lưu ý:** (1) trần + fog gần làm cảnh tối hơn → cần tăng nhẹ ambient/đèn trần bù lại; (2) so le tranh đổi vị trí 100 token → deep link `#/token/:id` và minimap vẫn đúng vì đều đọc từ `tokenPositions`, nhưng người dùng cũ sẽ thấy tranh "dời chỗ" một lần; (3) `AmbientEmoji` bay ra ngoài hành lang sẽ bị trần che — thu bán kính spawn về trong hành lang (r 9–19).

---

## Kết quả triển khai (2026-06-11)

Tất cả tiêu chí nghiệm thu đạt, xác minh bằng screenshot headless (sweep 360° tại đáy/giữa/trước cửa sổ/đỉnh — `/tmp/pw-driver/shoot-phase7.mjs`, ảnh trong `/tmp/pw-driver/p7/`).

### Khác biệt so với plan (phát hiện khi đo geometry thật)

1. **KHÔNG nâng `wallHeight` 4 → 5.5.** Xoắn ốc tự chồng: `wallHeight === heightPerTurn (= 4)` nghĩa là mép tường vòng k chạm đúng sàn vòng k+1 → hành lang **vốn tự kín trần** (trần của vòng k chính là gầm sàn vòng k+1), liền mạch không khe. Nâng tường lên 5.5 sẽ trùng mặt với tường vòng trên → z-fighting toàn tuyến, và "trần ở ramp+5.5" sẽ đâm xuyên sàn vòng trên (ramp+4). Thay vào đó:
   - Camera kẹp `≤ charY+2.0` (= ramp+3.5, dưới mép tường) — đủ để không bao giờ nhìn vượt tường.
   - Chỉ vòng trên cùng hở trời → thêm **mái** = kéo dài helix sàn thêm 1 vòng (`getRoofRange`), khoét **skylight** ở đoạn cuối ngay trên đỉnh.
2. **Lỗ hổng plan không thấy: giếng trung tâm (r<8).** Tường trong là helix nên phía xuống dốc thấp hơn tầm mắt → nhìn được vào giếng giữa, giếng này hở nóc/đáy → lọt sky. Đã bịt: nắp tròn trên (y=28) + sàn (y=0) + 2 dải trống cylinder che khe xoắn ở 4 đơn vị trên cùng/dưới cùng của trụ r=8. Giếng giờ là **atrium kín** — DataColumn thành tác phẩm trung tâm nhìn từ hành lang.
3. Cửa sổ nằm trong dải `sill 1.1 → top 3.4` (tường 4 cao), khoét theo segment grid (`getWindowOpenings`, snap để lỗ tường khớp kính/khung); kính + khung là band cong (`createWallBandGeometry`) bám đúng mặt trụ — khung vàng (Moon, 6 cái) / khung cyan (Earth, turn 0). Nến candlestick trong vùng cửa sổ được lọc bỏ.
4. Đèn trần: dải `createSpiralBandGeometry` 13.8–14.4 ở `ramp+3.95` chạy suốt (dừng trước skylight), màu `#cdbd96` đủ dịu để bloom không lóa khi nhìn góc nghiêng.

### Nghiệm thu bằng ảnh
- Đáy (Level 1/6): kín 360°, biển **ENTRANCE 🌀** + vách chắn hiện đúng.
- Giữa (4/6): tranh xen kẽ trái/phải nhịp ~30°, tâm tranh giữa khung hình, nến + đèn trần đúng vị trí.
- Trước cửa sổ vòng 2 & vòng 6: **Moon to, rõ, ngang tầm mắt** qua khung vàng; sao/tím chỉ xuất hiện trong kính + skylight.
- Đỉnh (6/6): biển **SUMMIT 🌕**, thảm gold–đỏ vòng 6 thay rainbow, skylight lộ sao ngay trên đầu.
- 0 console error; `npm run build` sạch.
