# Giai đoạn 4 — Học B-roll · Animation · Motion Graphics & Bảng kết hợp Thông minh

Mục tiêu: Giúp `/dung-video` biết DÙNG GÌ, Ở ĐÂU, LÚC NÀO, VÌ SAO để minh họa lời nói, phối hợp nhịp nhàng giữa Phụ đề, Chữ Hook, Animation/MG và SFX.

## 1. Phân loại 3 Nhóm Minh họa
- `BR` B-roll: Cảnh minh họa câu nói (toàn cảnh, cận chi tiết, đường trước nhà, flycam, nội thất, J-cut/L-cut).
- `AN` Animation minh họa: Mặt bằng tự vẽ nét tường, thước đo laser, mũi tên, icon SVG động (`IC-01..IC-24`), số đếm chạy, bản đồ zoom.
- `MG` Thẻ & Nhãn: Thẻ thông số kính mờ (`Spec Card`), nhãn phòng/tầng, lower-third, bộ đếm.

## 2. Bắt buộc Phân tích "Vì sao" (Mục đích & Lý do)
Mỗi phần tử được bóc tách bắt buộc ghi rõ:
- `muc_dich`: minh_hoa_loi · chung_minh_so_lieu · dinh_vi · doi_nhip_giu_chan · chuyen_y · nhan_gia · tao_to_mo · keu_goi.
- `ly_do`: 1 câu giải thích vì sao mẫu đặt ĐÚNG thời điểm đó (vd: "Thước đo laser bắn nét ngay khi người dẫn phát âm kích thước 5m x 20m để tạo ấn tượng trực quan").
- `gan_loi`: Câu thoại nào, lệch bao nhiêu giây (`±s`).
- `gan_phach`: Rơi trúng phách mạnh hay phách yếu của BGM.
- `ket_hop`: Đi cùng chữ kiểu nào, màu gì, icon động nào (`IC-xx`), SFX gì và chuyển cảnh gì.

## 3. Quản lý Bảng kết hợp Thông minh (`asset/phong_cach/ket_hop/INDEX.md`)
- Cấu trúc: `| Dấu hiệu lời | Combo (B-roll + AN/MG + Chữ + Icon IC-xx + SFX + Chuyển cảnh) | Thời điểm so với từ khóa | Vì sao | Video gốc + giây | Lần dùng | Dũng chấm |`.
- `/dung-video` ở Giai đoạn 4–5 sẽ tra cứu trực tiếp bảng này theo từng từ khóa trong `words.json` để kích hoạt đồ họa minh họa đi kèm phụ đề.
