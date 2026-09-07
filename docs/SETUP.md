# Cài đặt LoV Music

## GitHub Pages — không cần chạy localhost

Source hiện hỗ trợ build tĩnh, đọc và phát nhạc trực tiếp từ Google Drive. Xem docs/GITHUB-PAGES.md trong repository để tạo browser API key, cấu hình GitHub Actions và deploy. File này bên dưới mô tả chế độ Node local và phần Supabase tùy chọn.

## 1. Chạy website

Cần Node.js 22 trở lên. Không cần cài dependency.

```bash
cp .env.example .env
npm run dev
```

Mở http://localhost:3000. Nếu cổng đang bận, đổi PORT trong .env.

## 2. Lấy nhạc Google Drive (nguồn nhạc hiện tại)

Thư mục mặc định: https://drive.google.com/drive/folders/1xmor8nF56-i_UU3c5B7IOgdx5dgoUn5D
Thư mục bạn gửi ban đầu cũng dùng được bằng cách thay ID:
1q6vPV5Gk4xNAQHx7LJHolByRtXZRaGDy

1. Trong Google Drive, mở Chia sẻ của thư mục nhạc, chọn “Bất kỳ ai có đường liên kết” và quyền Người xem. Kiểm tra file bên trong có thể tải xuống bằng cửa sổ ẩn danh.
2. Mở https://console.cloud.google.com/ và tạo/chọn project.
3. Vào APIs & Services → Library → tìm Google Drive API → Enable.
4. Vào APIs & Services → Credentials → Create credentials → API key.
5. Giới hạn key chỉ được gọi Google Drive API. Backend dùng key này, nên khi có server cố định có thể giới hạn theo IP của server; không dùng giới hạn HTTP referrer dành cho trình duyệt.
6. Điền vào .env:

```env
DRIVE_API_KEY=key_cua_ban
DRIVE_FOLDER_ID=1xmor8nF56-i_UU3c5B7IOgdx5dgoUn5D
PORT=3000
```

7. Khởi động lại server, bấm “Làm mới thư viện”. Có thể đổi link thư mục trong “Kết nối & cài đặt”.

API key chỉ đọc dữ liệu công khai; không thay thế đăng nhập cho Drive riêng tư. Không gửi key cho người khác hoặc đưa .env lên Git. Nếu không muốn công khai nhạc, cần triển khai OAuth hoặc service account được chia sẻ thư mục; bản này chưa có phần đó.

Ứng dụng đọc file trực tiếp trong thư mục (chưa quét thư mục con), hỗ trợ phân trang và chuyển tiếp HTTP Range để tua khi Drive hỗ trợ. MP3 là lựa chọn tương thích phổ biến; FLAC/AAC và các định dạng khác phụ thuộc trình duyệt. Drive có thể giới hạn lưu lượng hoặc quyền tải file; nên chuyển sang Storage khi có nhiều người nghe.

Tên file theo dạng “Tên bài - Ca sĩ.mp3” để tự tách tên. Ảnh trên giao diện là ảnh phong cảnh minh họa từ Unsplash, không phải bìa bài hát. Font tải từ Google Fonts; có font hệ thống dự phòng.

## 3. Tạo Supabase (chuẩn bị cho upload và database)

Bản hiện tại CHƯA dùng Supabase và CHƯA có upload. Các bước dưới tạo nền tảng cho giai đoạn tích hợp; chỉ tạo project không tự bật tính năng upload trên website.

1. Mở https://supabase.com/dashboard → New project, đặt tên và mật khẩu database mạnh, chọn region gần người dùng.
2. Vào Authentication → Users → Add user để tạo tài khoản quản trị (email/password).
3. Copy UUID của tài khoản đó.
4. Mở file supabase/schema.sql trong dự án, thay tất cả YOUR_ADMIN_UUID bằng UUID vừa copy.
5. Vào SQL Editor → New query, dán nội dung file đã thay → Run. Script dành cho project mới, chạy một lần.
6. Vào Storage → New bucket → đặt tên music, chọn Public nếu muốn mọi người có link đều nghe được. Giới hạn kích thước upload theo nhu cầu và MIME audio phù hợp.
7. Đọc phần policy trong schema: chỉ tài khoản quản trị đã chỉ định mới thêm/sửa/xóa bài và upload file. Mọi người có thể đọc thông tin bài hát và file trong bucket công khai.
8. Lấy Project URL và publishable key trong mục kết nối/API của project. Đây là cấu hình cần cho bước tích hợp frontend; không dùng secret/service_role key trên trình duyệt.

Sau khi hoàn thành, phần tiếp theo cần xây dựng là: đăng nhập quản trị → upload Storage → lưu metadata vào bảng tracks → đọc danh sách từ database. Google Drive vẫn có thể là nguồn phụ.

Nếu muốn thư viện riêng tư, chọn bucket private và thay chính sách đọc theo người dùng được phép, đồng thời phát bằng signed URL. Schema mẫu dưới đây dành cho nghe công khai, quản trị upload.

## 4. Triển khai

Dùng hosting chạy được Node.js server lâu dài (container/VPS hoặc Node web service), cấu hình biến môi trường ở hosting và HTTPS. Nếu dùng GitHub Pages, chạy npm run build:pages và publish dist theo docs/GITHUB-PAGES.md; server.js chỉ dành cho chế độ Node. Bản hiện tại phù hợp chạy thử cá nhân; trước khi mở công khai cần bổ sung rate limit và giới hạn nguồn Drive cho endpoint để kiểm soát quota.

## Tài liệu chính thức

- Drive API: https://developers.google.com/workspace/drive/api/guides/enable-sdk
- Tải file Drive: https://developers.google.com/workspace/drive/api/guides/manage-downloads
- Supabase Storage: https://supabase.com/docs/guides/storage
- Storage access control: https://supabase.com/docs/guides/storage/security/access-control
