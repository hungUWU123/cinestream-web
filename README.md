# 🎬 CineStream - Hệ Thống Website Xem Phim Chuyên Nghiệp

CineStream là hệ thống xem phim trực tuyến full-stack chuyên nghiệp được xây dựng dựa trên Next.js 15 và NestJS, tích hợp cơ chế đồng bộ tự động dữ liệu từ OPhim API, phát video qua luồng HLS (.m3u8) với trình phát tùy chỉnh mượt mà, lưu lịch sử xem phim và bình luận thời gian thực.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: Zustand (Persisted Auth)
- **Data Fetching**: TanStack React Query v5
- **Animations**: Framer Motion
- **Video Player**: HLS.js (Tự phát triển bộ điều khiển tuỳ chỉnh)
- **Notification**: React Hot Toast

### Backend
- **Framework**: NestJS (Node.js)
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (Lưu trữ phim, tập phim, lịch sử, bình luận, yêu thích, tài khoản)
- **Caching & Rate Limiting**: Redis + NestJS Throttler
- **Authentication**: JWT (Access Token 15m + Refresh Token 7d)
- **Validation**: Class-validator

---

## 📁 Cấu Trúc Dự Án

```text
webfullstack/
├── backend/               # NestJS Backend API
│   ├── src/
│   │   ├── auth/          # JWT & Đăng ký / Đăng nhập
│   │   ├── users/         # Quản lý tài khoản
│   │   ├── movies/        # API danh sách phim, chi tiết phim
│   │   ├── episodes/      # API danh sách tập
│   │   ├── ophim/         # Dịch vụ đồng bộ phim từ ophim1.com
│   │   ├── watch-history/ # Lịch sử xem phim người dùng
│   │   ├── favorites/     # Danh sách phim yêu thích
│   │   ├── comments/      # Bình luận & Phản hồi bình luận
│   │   ├── search/        # Bộ lọc tìm kiếm & gợi ý từ khóa
│   │   └── admin/         # Quản trị hệ thống (Đồng bộ, khóa tài khoản, ẩn comment)
│   └── prisma/            # Schema định nghĩa database PostgreSQL
├── frontend/              # Next.js 15 Frontend Client
│   ├── src/
│   │   ├── app/           # App Router (Home, Movies, Watch, Profile, Search, Admin)
│   │   ├── components/    # Layout, Movie Hero, Rows, HlsPlayer, CommentSection
│   │   ├── lib/           # Axios Client API & Refresh Token Interceptor
│   │   ├── store/         # Zustand Store lưu Auth
│   │   └── types/         # Định nghĩa kiểu dữ liệu TypeScript
└── docker-compose.yml     # Khởi chạy PostgreSQL & Redis nhanh chóng
```

---

## 🚀 Hướng Dẫn Cài Đặt và Chạy Local

### 1. Khởi chạy Database & Redis qua Docker
Bạn cần cài đặt Docker Desktop trên máy tính. Chạy lệnh sau ở thư mục gốc để khởi động PostgreSQL và Redis:

```bash
docker-compose up -d
```

### 2. Cài đặt và chạy Backend (NestJS)

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` tại thư mục `/backend/.env` với nội dung:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cinestream?schema=public"
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET="cinestream_jwt_secret_key_super_secure_123!"
   JWT_REFRESH_SECRET="cinestream_jwt_refresh_secret_key_super_secure_456!"
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   ```
4. Đồng bộ Schema Prisma và khởi tạo Database:
   ```bash
   npx prisma db push
   ```
5. Chạy backend ở chế độ Development:
   ```bash
   npm run start:dev
   ```
   API Server sẽ chạy tại: `http://localhost:5000/api`

### 3. Cài đặt và chạy Frontend (Next.js)

1. Mở terminal mới, di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env.local` tại thư mục `/frontend/.env.local` với nội dung:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_OPHIM_IMAGE_CDN=https://img.ophim.live/uploads/movies
   NEXT_PUBLIC_SITE_NAME=CineStream
   ```
4. Chạy frontend ở chế độ Development:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:3000`

---

## 🍿 Hướng Dẫn Đồng Bộ Phim Từ OPhim

Để có dữ liệu hiển thị trên trang chủ và trang tìm kiếm, bạn cần đăng nhập tài khoản quản trị và thực hiện đồng bộ phim.

1. **Đăng ký tài khoản**: Đăng ký một tài khoản mới trên giao diện web.
2. **Nâng quyền Admin**: Vào database PostgreSQL (ví dụ qua pgAdmin hoặc DBeaver) và cập nhật cột `role` của tài khoản của bạn thành `'ADMIN'`.
3. **Truy cập trang Quản trị**: Nhấp vào avatar của bạn ở góc trên bên phải trang web và chọn **Quản trị** (hoặc truy cập trực tiếp `http://localhost:3000/admin`).
4. **Đồng bộ phim**:
   - **Đồng bộ phim mới cập nhật**: Chọn tab *Đồng bộ phim OPhim*, nhập số trang (ví dụ: `2` trang) và nhấn *Khởi chạy đồng bộ*. Hệ thống sẽ lấy danh sách phim mới nhất trên OPhim để lưu về database.
   - **Đồng bộ phim cụ thể**: Nhập slug phim từ ophim (ví dụ: `tran-chien-sinh-tu`) và nhấn *Đồng bộ ngay*.

---

## 🌐 Hướng Dẫn Triển Khai Lên VPS Ubuntu (Linux)

### 1. Chuẩn bị VPS
Yêu cầu hệ thống đã cài đặt:
- **Node.js** (v18 trở lên)
- **Docker** & **Docker Compose**
- **Nginx** (Làm Reverse Proxy)
- **PM2** (`npm install -g pm2` để quản lý tiến trình Node.js)

### 2. Triển khai Database & Caching bằng Docker
Tạo file `docker-compose.yml` tương tự trên VPS và khởi chạy:
```bash
docker-compose up -d
```

### 3. Build và Chạy Backend với PM2
1. Clone mã nguồn lên VPS.
2. Cấu hình `.env` cho backend trỏ tới cổng production.
3. Build dự án:
   ```bash
   cd backend
   npm install
   npm run build
   npx prisma db push
   ```
4. Chạy dự án bằng PM2:
   ```bash
   pm2 start dist/main.js --name cinestream-backend
   ```

### 4. Build và Chạy Frontend với PM2
1. Cấu hình `.env.local` cho frontend với API trỏ tới tên miền của bạn (ví dụ: `https://api.yourdomain.com/api`).
2. Build dự án:
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```
3. Chạy frontend bằng PM2:
   ```bash
   pm2 start npm --name cinestream-frontend -- start
   ```
4. Lưu trạng thái các ứng dụng PM2 để tự động chạy khi khởi động lại VPS:
   ```bash
   pm2 save
   pm2 startup
   ```

### 5. Cấu hình Nginx làm Reverse Proxy & Cài đặt SSL (HTTPS)
1. Tạo file cấu hình Nginx cho tên miền:
   ```bash
   sudo nano /etc/nginx/sites-available/cinestream
   ```
2. Thêm cấu hình sau:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com; # Thay thế bằng tên miền của bạn

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   server {
       listen 80;
       server_name api.yourdomain.com; # Tên miền phụ cho API

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Kích hoạt cấu hình và tải lại Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cinestream /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```
4. Cài đặt SSL miễn phí thông qua Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```
   Chọn tùy chọn chuyển hướng tự động HTTP sang HTTPS. Hệ thống xem phim CineStream của bạn đã trực tuyến và bảo mật an toàn!
