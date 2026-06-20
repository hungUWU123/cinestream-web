# 🖥️ Hướng dẫn Triển khai CineStream lên VPS Windows Server

Tài liệu này hướng dẫn chi tiết từng bước để bạn tự chạy toàn bộ dự án **CineStream** (Frontend Next.js + Backend NestJS + SQLite Database) trên một **VPS chạy hệ điều hành Windows Server** (2019 / 2022).

---

## 🛠️ PHẦN 1: CÁC PHẦN MỀM CẦN CÀI ĐẶT TRÊN VPS

Khi bạn kết nối vào VPS qua **Remote Desktop (mstsc)**, hãy mở trình duyệt trên VPS và tải về các công cụ sau:

1. **Node.js**:
   - Tải phiên bản **LTS mới nhất** (Khuyên dùng v20 hoặc v22) từ trang chủ: [https://nodejs.org/](https://nodejs.org/)
   - Cài đặt bình thường (nhấn Next liên tục).
2. **Git**:
   - Tải Git cho Windows từ: [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Cài đặt bình thường.

---

## 📂 PHẦN 2: TẢI CODE VÀ CÀI ĐẶT DỰ ÁN

1. Trên VPS, bấm phím **Windows**, gõ **`cmd`** để mở Command Prompt (hoặc mở PowerShell).
2. Di chuyển cmd ra ổ đĩa `C:\` (hoặc thư mục bạn muốn lưu dự án):
   ```cmd
   cd C:\
   ```
3. Chạy lệnh clone để tải code từ GitHub về VPS:
   ```cmd
   git clone https://github.com/hungUWU123/cinestream-web.git
   ```
4. Di chuyển vào thư mục dự án:
   ```cmd
   cd cinestream-web
   ```

---

## ⚙️ PHẦN 3: CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV) TRÊN VPS

### 1. Cấu hình Backend:
- Trên VPS, bạn vào thư mục `C:\cinestream-web\backend\`.
- Tạo hoặc chỉnh sửa file **`.env`** (bằng Notepad) và cấu hình như sau:
  ```env
  NODE_ENV=production
  PORT=5000

  # Sử dụng SQLite cục bộ vĩnh viễn trên VPS
  DATABASE_URL="file:./dev.db"

  # Cấu hình Redis (nếu bạn có cài Redis, nếu không thì backend vẫn tự chạy fallback không lỗi)
  REDIS_URL="redis://localhost:6379"

  # Khóa bảo mật JWT
  JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production_min_32_chars
  JWT_REFRESH_EXPIRES_IN=7d

  # API OPhim để đồng bộ phim
  OPHIM_BASE_URL=https://ophim1.com
  OPHIM_IMAGE_CDN=https://img.ophim.live/uploads/movies

  # Địa chỉ IP của VPS chạy Frontend (Cổng 3000)
  FRONTEND_URL="http://[IP-VPS-CUA-BAN]:3000"

  THROTTLE_TTL=60
  THROTTLE_LIMIT=100
  ```
  *(Thay thế `[IP-VPS-CUA-BAN]` bằng địa chỉ IP thực tế của VPS).*

### 2. Cấu hình Frontend:
- Trên VPS, bạn vào thư mục `C:\cinestream-web\frontend\`.
- Tạo file **`.env.local`** (bằng Notepad) và điền cấu hình kết nối tới API của Backend:
  ```env
  NEXT_PUBLIC_API_URL="http://[IP-VPS-CUA-BAN]:5000/api"
  ```
  *(Thay thế `[IP-VPS-CUA-BAN]` bằng địa chỉ IP thực tế của VPS).*

---

## ⚡ PHẦN 4: BIÊN DỊCH VÀ CÀI ĐẶT HỆ THỐNG

Mở Command Prompt trên VPS và chạy tuần tự các lệnh sau:

### 1. Cài đặt và build Backend:
```cmd
cd C:\cinestream-web\backend
npm install
npx prisma db push
npm run build
```

### 2. Cài đặt và build Frontend (Next.js):
```cmd
cd C:\cinestream-web\frontend
npm install
npm run build
```

---

## 🔄 PHẦN 5: CHẠY WEB 24/7 BẰNG PM2 (KHÔNG LO SẬP WEB)

Để trang web tự động chạy ngầm, không bị tắt khi bạn thoát Remote Desktop và tự khởi động lại khi VPS bị reset, chúng ta sử dụng công cụ **PM2**.

1. Cài đặt PM2 toàn cục trên VPS:
   ```cmd
   npm install -g pm2
   ```
2. Khởi chạy **Backend** cổng 5000:
   ```cmd
   cd C:\cinestream-web\backend
   pm2 start dist/main.js --name cinestream-backend
   ```
3. Khởi chạy **Frontend** cổng 3000:
   ```cmd
   cd C:\cinestream-web\frontend
   pm2 start npm --name cinestream-frontend -- start
   ```
4. Lưu trạng thái PM2 để tự khởi động cùng Windows:
   ```cmd
   pm2 save
   ```

---

## 🛡️ PHẦN 6: MỞ CỔNG FIREWALL TRÊN VPS WINDOWS (QUAN TRỌNG)

Mặc định, Windows Server sẽ chặn người ngoài truy cập vào các cổng 3000 và 5000. Bạn phải mở port trên tường lửa thì người khác mới vào được web:

1. Bấm nút **Start** trên VPS, gõ tìm và mở: **`Windows Defender Firewall with Advanced Security`**.
2. Ở danh sách cột bên trái, click vào **`Inbound Rules`**.
3. Ở cột bên phải, click vào **`New Rule...`**.
4. Chọn **`Port`** -> nhấn **Next**.
5. Chọn **`TCP`**, tại ô *Specific local ports* nhập vào: **`3000, 5000`** -> nhấn **Next**.
6. Chọn **`Allow the connection`** (Cho phép kết nối) -> nhấn **Next**.
7. Nhấn **Next** ở phần Profile (giữ nguyên tích chọn Domain, Private, Public).
8. Tại ô **Name**, đặt tên bất kỳ (ví dụ: `CineStream Web Ports`) -> nhấn **Finish**.

---

🎉 **HOÀN THÀNH!**
Bây giờ, bạn có thể truy cập vào website của mình thông qua địa chỉ:
👉 **`http://[IP-VPS-CUA-BAN]:3000`**

Dữ liệu SQLite và ảnh đại diện sẽ được lưu trữ vĩnh viễn và an toàn trên ổ cứng VPS của bạn!
