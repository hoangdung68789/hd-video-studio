# Giai đoạn 5b — MG bản đồ kiểu Google Maps (chi tiết)

**5b. MG bản đồ kiểu Google Maps (tự động khi lời thoại nói về vị trí/tiện ích/đường/khu vực)** (agent Đồ họa)
- Mặc định: bán kính 2km; 2–3 tiện ích, ưu tiên Bệnh viện → Siêu thị → Trường học (mỗi nhóm 1 điểm gần nhất trong 2km); 2–3 tuyến đường chính gần nhất. Lời thoại nêu tên tiện ích/đường cụ thể → bắt buộc dùng đúng tên đó.
- Dữ liệu thật: OpenStreetMap qua Overpass API (`amenity=hospital`, `shop=supermarket|mall`, `amenity=school`, `highway=trunk|primary|secondary`), chạy trên máy Dũng. Khoảng cách đường thẳng, làm tròn 0,1km, ghi "~1,2km"; không ghi số phút nếu không có dữ liệu. Điểm không có trong OSM → bỏ, không bịa.
- Tâm bản đồ: link Google Maps hoặc tên đường + phường do Dũng cung cấp; thiếu → hỏi 1 câu, không đoán.
- Bảo mật: pin dịch ngẫu nhiên 80–150m khỏi vị trí thật; không số nhà/tên hẻm.
- Phong cách giống Google Maps, tự vẽ bằng code (không logo/giao diện/ảnh chụp của Google): nền #F1F3F4; đường chính vàng #FDE293 viền #F9AB00; đường thường trắng viền #DADCE0; công viên #C8E6C9; sông #AADAFF; pin giọt nước đỏ #EA4335; icon tròn (bệnh viện dấu cộng, siêu thị giỏ hàng, trường mũ tốt nghiệp); font Roboto; nhãn không nền. Góc dưới ghi nhỏ `© OpenStreetMap` (bắt buộc).
- Chuyển động 4–6s, đặt đúng lúc lời thoại nói về vị trí, không cắt lời: zoom từ quận vào khu (whoosh) → pin rơi + nảy (pop) → vòng 2km lan ra (sonar ping) → đường vẽ nét sáng dần + tên đường (nhãn chữ: không SFX) → tiện ích bật lên theo lời thoại, đường nét đứt nối từ pin (SFX gắn vào chuyển động đồ họa của bản đồ, mỗi tiện ích 1 SFX khác nhau; nhãn chữ không SFX) → giữ 0,5s rồi chuyển cảnh.
- Công cụ: `remotion-maps` (MapLibre, không cần key) hoặc vẽ SVG từ GeoJSON đã tải trong HyperFrames.

