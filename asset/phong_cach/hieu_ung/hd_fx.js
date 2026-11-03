// Thư viện hiệu ứng chữ dùng lại cho mọi template (GSAP, chạy trong HyperFrames). Mã khớp với INDEX.md cùng thư mục.
// Mỗi hàm thêm tween vào timeline `tl` cho phần tử `el` (một .dong chứa các .ky span) bắt đầu ở giây `t`.
// Số khung đo từ TV-10 (@editortapsu78, 02/11/2026) ở 15 fps; tên gọi CapCut tương ứng ghi trong INDEX.md.
window.HDFX = (function () {
  const kys = (el) => el.querySelectorAll(".ky");
  const VAO = {
    // CH-GO: gõ từng ký tự (CapCut: "Typewriter"/"Máy đánh chữ") — cả dòng xong trong 0,13 s (2 khung @15fps, đo TV-10)
    go_chu_trai_sang_phai(tl, el, t) {
      const k = kys(el), step = 0.13 / Math.max(1, k.length);
      tl.set(k, { opacity: 0 }, t);
      k.forEach((c, i) => tl.set(c, { opacity: 1 }, t + i * step));
    },
    // CH-TRUOT-NHOE: trượt vào có nhòe chuyển động — lệch 6% khung, nhòe 10px → 0, 0,15 s
    _truot(tl, el, t, dx, dy) {
      tl.fromTo(el, { x: dx, y: dy, opacity: 0, filter: "blur(10px)" },
        { x: 0, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.15, ease: "power3.out" }, t);
    },
    truot_phai(tl, el, t) { this._truot(tl, el, t, -65, 0); },
    truot_trai(tl, el, t) { this._truot(tl, el, t, 65, 0); },
    truot_len(tl, el, t) { this._truot(tl, el, t, 0, 60); },
    truot_xuong(tl, el, t) { this._truot(tl, el, t, 0, -60); },
    // CH-MO: hiện mờ dần tại chỗ — 0,12 s
    hien_tai_cho(tl, el, t) { tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" }, t); },
    // CH-PHONG: phóng to bật vào — 70% → 100%, 0,2 s
    phong_to(tl, el, t) { tl.fromTo(el, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(2)" }, t); },
    cat_cung(tl, el, t) { tl.set(el, { opacity: 1 }, t); },
  };
  const RA = {
    // ra ngược kiểu gõ: xóa từ phải sang trái 0,15 s
    go_chu_trai_sang_phai(tl, el, t) {
      const k = Array.from(kys(el)).reverse(), step = 0.15 / Math.max(1, k.length);
      k.forEach((c, i) => tl.set(c, { opacity: 0 }, t + i * step));
    },
    _truot(tl, el, t, dx, dy) {
      tl.to(el, { x: dx, y: dy, opacity: 0, filter: "blur(10px)", duration: 0.15, ease: "power3.in" }, t);
    },
    truot_phai(tl, el, t) { this._truot(tl, el, t, 65, 0); },
    truot_trai(tl, el, t) { this._truot(tl, el, t, -65, 0); },
    truot_len(tl, el, t) { this._truot(tl, el, t, 0, -60); },
    truot_xuong(tl, el, t) { this._truot(tl, el, t, 0, 60); },
    thu_nho(tl, el, t) { tl.to(el, { scale: 0.7, opacity: 0, duration: 0.15, ease: "power2.in" }, t); },
    hien_tai_cho() {}, phong_to() {}, cat_cung() {},
  };
  return {
    vao: (tl, el, kieu, t) => (VAO[kieu] || VAO.hien_tai_cho).call(VAO, tl, el, t),
    ra: (tl, el, kieu, t) => (RA[kieu] || RA.cat_cung).call(RA, tl, el, t),
  };
})();
