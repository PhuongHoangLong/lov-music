# Đưa LoV Music lên GitHub Pages

Bản Pages là website tĩnh: trình duyệt đọc danh sách và phát âm thanh trực tiếp từ Google Drive. Không cần chạy máy tính cá nhân, Node hosting hay Supabase khi truy cập site. Node chỉ dùng trong GitHub Actions để đóng gói.

## 1. Tạo repository

Tạo repository public, ví dụ `lov-music`, trên GitHub. Đưa source lên nhánh `main`, bao gồm thư mục `.github/workflows`. Không upload `.env`, `dist`, `.git` hoặc node_modules. File `.gitignore` đã loại trừ các mục này khi dùng Git.

Địa chỉ dự kiến: https://USERNAME.github.io/lov-music/

## 2. Tạo browser API key riêng

Trong Google Cloud Console → APIs & Services:

1. Bật Google Drive API trong project.
2. Credentials → Create credentials → API key.
3. Application restrictions → Websites (HTTP referrers).
4. Thêm `https://USERNAME.github.io/*` (thay USERNAME bằng tài khoản thật). Dùng toàn bộ domain vì trình duyệt thường chỉ gửi origin trong referrer khi gọi khác miền. Nếu dùng domain riêng, thêm domain đó.
5. API restrictions → Restrict key → Google Drive API → Save.
6. Thư mục và các bài hát trong Drive phải được chia sẻ “Bất kỳ ai có đường liên kết”, cho phép tải xuống.

Key dùng trong website tĩnh luôn có thể xem bằng trình duyệt. GitHub Secret chỉ tránh ghi key vào lịch sử source; KHÔNG giấu key trong website đã build. Không đưa key server hiện tại lên Pages một cách mặc định. Không dùng OAuth client secret hoặc Supabase service_role ở đây.

## 3. Cấu hình repository

Settings → Secrets and variables → Actions:

- Secrets → New repository secret: tên `DRIVE_BROWSER_API_KEY`, giá trị là browser key ở bước 2.
- Variables → New repository variable: tên `DRIVE_FOLDER_ID`, giá trị `1xmor8nF56-i_UU3c5B7IOgdx5dgoUn5D` (có thể bỏ qua để dùng mặc định).

Settings → Pages → Build and deployment → Source: **GitHub Actions**.

Actions → Deploy LoV Music to GitHub Pages → Run workflow (nhánh main).

Khi chạy thành công, mở link tại Settings → Pages. Những lần push tiếp theo vào main sẽ tự deploy. Người nghe chỉ cần mở link, không nhập API key và không cần chạy localhost.

## 4. Xác minh

- Mở link bằng cửa sổ ẩn danh: logo/font và 30 bài xuất hiện.
- Phát bài, tua giữa bài, chuyển bài trên điện thoại.
- Kiểm tra tìm kiếm, list/grid và lưu bài.
- Nếu 403: kiểm tra quyền chia sẻ, Google Drive API, API restrictions và domain HTTP referrer. Chờ vài phút sau khi đổi giới hạn key rồi thử lại.

Bài đã lưu và lịch sử vẫn lưu riêng trên từng trình duyệt, chưa đồng bộ giữa các thiết bị. Cần mạng để nghe; Drive có thể áp dụng quota/giới hạn tải và một số định dạng phụ thuộc trình duyệt.

## Build thủ công

Cung cấp biến môi trường DRIVE_BROWSER_API_KEY và tùy chọn DRIVE_FOLDER_ID rồi chạy `npm run build:pages`. Chỉ publish thư mục dist. Không mở index.html bằng file:// vì ES modules cần web server.

## Tài liệu

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.cloud.google.com/docs/authentication/api-keys
