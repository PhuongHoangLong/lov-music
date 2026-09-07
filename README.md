# LoV Music

**Deploy GitHub Pages:** [Hướng dẫn từng bước](docs/GITHUB-PAGES.md). Đã có workflow tự build và deploy khi push main. Bản Pages phát nhạc trực tiếp từ Drive, không cần chạy localhost.

Website nghe nhạc single page, giao diện tối/tím, responsive theo ảnh tham khảo. Node.js 22+, không có dependency.

```bash
cp .env.example .env
npm run dev
```

Mở http://localhost:3000. Điền Google Drive API key vào `.env` để tải nhạc thật. Không có bài hát giả hoặc file âm thanh mẫu. Yêu thích và lịch sử lưu trên trình duyệt, chưa đồng bộ tài khoản.

Hướng dẫn Google Drive, Supabase và triển khai: [docs/SETUP.md](docs/SETUP.md).

Supabase là bước chuẩn bị, chưa tích hợp vào ứng dụng. Ảnh phong cảnh dùng minh họa từ Unsplash.

Kiểm tra: `npm run check` và `npm test`.
