# RSign Admin - Hệ thống Quản lý Chữ ký Số

RSign Admin là nền tảng quản trị web toàn diện để quản lý chữ ký số, tài liệu, mẫu văn bản và quy trình người dùng. Được xây dựng với React, TypeScript và các công nghệ web hiện đại.

## 🚀 Tính năng

- **Quản lý Tài liệu**: Tạo, gửi, theo dõi và quản lý tài liệu cần ký
- **Hệ thống Mẫu**: Xây dựng mẫu tài liệu có thể tái sử dụng với các vùng chữ ký định sẵn
- **Xử lý Hàng loạt**: Xử lý nhiều tài liệu hiệu quả với tính năng batch
- **Quản lý Người dùng**: Quản lý người dùng, vai trò và quyền hạn
- **Nhóm Người ký**: Tổ chức người ký thành các nhóm có thể tái sử dụng
- **Dashboard Thời gian thực**: Theo dõi trạng thái tài liệu và tiến độ ký
- **Đặt Vùng Ký trên PDF**: Trình xem PDF tương tác để cấu hình vùng chữ ký
- **Nhiều Chế độ Ký**:
    - Individual (tài liệu riêng cho mỗi người ký)
    - Shared (một tài liệu nhiều người ký)
- **Quy trình Ký**: Ký tuần tự hoặc song song

## 📋 Yêu cầu Hệ thống

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- **Node.js**: Phiên bản 18.x trở lên
- **npm**: Phiên bản 9.x trở lên (đi kèm với Node.js)
- **Git**: Để clone repository

## 🛠️ Hướng dẫn Cài đặt

### Bước 1: Clone Repository

```bash
git clone https://github.com/binhtruong9418/rsign-admin.git
cd rsign-admin
```

### Bước 2: Cài đặt Dependencies

```bash
npm install
```

Quá trình này sẽ tải và cài đặt tất cả các thư viện cần thiết cho dự án.

### Bước 3: Cấu hình Environment

Tạo file `.env` trong thư mục gốc của dự án:

```bash
# Cấu hình API
VITE_API_URL=http://localhost:3000/api

# Tùy chọn: Các cấu hình khác
# VITE_APP_NAME=RSign Admin
```

**Các biến môi trường quan trọng:**

- `VITE_API_URL`: URL cơ sở của Backend API (bắt buộc)

**Lưu ý**: File `.env` không được commit lên Git để bảo mật.

### Bước 4: Khởi động Server Development

```bash
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

Mở trình duyệt và truy cập địa chỉ trên để sử dụng ứng dụng.

## 📦 Build cho Production

### Build Dự án

```bash
npm run build
```

Lệnh này sẽ:

1. Chạy TypeScript compiler (`tsc -b`)
2. Build các file production được tối ưu hóa vào thư mục `dist/`

### Preview Build Production

Để xem trước phiên bản production trên máy local:

```bash
npm run preview
```

Ứng dụng production sẽ chạy tại `http://localhost:4173`

## 🏗️ Cấu trúc Dự án

```
rsign-admin/
├── src/
│   ├── assets/          # Tài nguyên tĩnh (hình ảnh, fonts)
│   ├── components/      # Các React component có thể tái sử dụng
│   │   ├── document-creation/   # Wizard tạo tài liệu
│   │   ├── template-creation/   # Wizard tạo mẫu
│   │   ├── layout/             # Components layout
│   │   └── ui/                 # UI components (Button, Input, etc.)
│   ├── contexts/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities và API clients
│   ├── pages/          # Các trang components
│   │   └── admin/      # Trang admin dashboard
│   ├── types/          # Định nghĩa TypeScript types
│   ├── App.tsx         # Component chính của app
│   └── main.tsx        # Entry point của ứng dụng
├── docs/               # Tài liệu
├── public/             # File tĩnh public
└── dist/               # Output build production (được tạo tự động)
```

## 🧪 Các Lệnh Có Sẵn

| Lệnh              | Mô tả                                       |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Khởi động server development với hot reload |
| `npm run build`   | Build cho production                        |
| `npm run preview` | Xem trước build production trên local       |
| `npm run lint`    | Chạy ESLint để kiểm tra chất lượng code     |

## 🔧 Công nghệ Sử dụng

### Core

- **React 18** - Thư viện UI
- **TypeScript** - JavaScript có type-safe
- **Vite** - Build tool và dev server

### Routing & State Management

- **React Router v6** - Routing phía client
- **TanStack Query (React Query)** - Quản lý state từ server

### Styling

- **TailwindCSS** - CSS framework utility-first
- **clsx** - Utility cho className có điều kiện

### HTTP & APIs

- **Axios** - HTTP client với interceptors
- **PDF.js** - Render và xử lý PDF

### UI Components

- **Lucide React** - Thư viện icon
- **React Hook Form** - Quản lý form
- **Zod** - Validation schema

## 🌐 Tích hợp API

Ứng dụng kết nối với backend API. Cấu hình URL API trong file `.env`:

```bash
VITE_API_URL=https://api.rsign.com/api
```

### Cấu trúc API Endpoints

```
/api/admin/
├── documents/        # Các thao tác CRUD tài liệu
├── templates/        # Quản lý mẫu
├── users/           # Quản lý người dùng
├── signer-groups/   # Các thao tác nhóm người ký
├── document-batches/# Các thao tác batch
└── statistics/      # Thống kê dashboard
```

Xem tài liệu API chi tiết tại: [docs/03-API-DOCUMENTATION.md](docs/03-API-DOCUMENTATION.md)

## 🔐 Xác thực (Authentication)

Ứng dụng sử dụng xác thực JWT:

1. Đăng nhập qua trang `/login`
2. JWT token được lưu trong localStorage
3. Tự động redirect về trang login khi nhận response 401
4. Routes được bảo vệ bằng component `ProtectedRoute`

## 📱 Trình duyệt Hỗ trợ

- Chrome (phiên bản mới nhất)
- Firefox (phiên bản mới nhất)
- Safari (phiên bản mới nhất)
- Edge (phiên bản mới nhất)

## 🐛 Xử lý Sự cố

### Port đã được sử dụng

Nếu port 5173 đã được sử dụng:

```typescript
// Sửa file vite.config.ts để đổi port
server: {
    port: 3000;
}
```

### Lỗi Build

Xóa cache và cài đặt lại:

```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

# Linux/Mac
rm -rf node_modules package-lock.json
npm install
```

### Vấn đề Render PDF

Đảm bảo PDF.js worker được cấu hình đúng trong `vite.config.ts`:

```typescript
optimizeDeps: {
    include: ["pdfjs-dist"];
}
```

### Lỗi kết nối API

- Kiểm tra biến `VITE_API_URL` trong file `.env`
- Đảm bảo backend API đang chạy
- Kiểm tra CORS configuration trên backend
- Xem console browser để biết chi tiết lỗi

## 📄 Giấy phép

Dự án này là private và proprietary.

## 👥 Đội ngũ Phát triển

- **Repository**: https://github.com/binhtruong9418/rsign-admin
- **Owner**: binhtruong9418

## 📚 Tài liệu

Tài liệu bổ sung trong thư mục `docs/`:

- [Hướng dẫn Tích hợp API](docs/03-API-DOCUMENTATION.md)
- [Tham chiếu Types Frontend](docs/FRONTEND_TYPES.md)
- [Tích hợp API Template](docs/FRONTEND_TEMPLATE_API_INTEGRATION.md)
- [Quy trình Tạo Tài liệu](docs/ADMIN_DOCUMENT_CREATION_WORKFLOW.md)
- [Hướng dẫn Thiết kế UI/UX](docs/04-UI-UX-DESIGN.md)

## 🚀 Hướng dẫn Bắt đầu Nhanh

1. **Cài đặt dependencies**:

    ```bash
    npm install
    ```

2. **Cấu hình môi trường**:
    - Tạo file `.env`
    - Thêm `VITE_API_URL=http://localhost:3000/api`

3. **Khởi động dev server**:

    ```bash
    npm run dev
    ```

4. **Đăng nhập**:
    - Truy cập `http://localhost:5173/login`
    - Sử dụng tài khoản admin

5. **Bắt đầu sử dụng**:
    - Tạo tài liệu
    - Tạo mẫu
    - Quản lý người dùng

## 🔄 Quy trình Development

### Làm việc với Git

```bash
# Tạo branch mới cho feature
git checkout -b feature/ten-tinh-nang

# Commit thay đổi
git add .
git commit -m "Mô tả thay đổi"

# Push lên remote
git push origin feature/ten-tinh-nang

# Tạo Pull Request trên GitHub
```

### Code Style

- Sử dụng ESLint để kiểm tra code: `npm run lint`
- Format code với Prettier (nếu có cấu hình)
- Tuân thủ TypeScript strict mode
- Viết components theo functional style với hooks

### Testing

```bash
# Chạy tests (nếu có)
npm test

# Chạy tests với coverage
npm run test:coverage
```

## 🎯 Tips Phát triển

1. **Hot Reload**: Vite hỗ trợ hot reload tự động khi save file
2. **TypeScript**: Sử dụng type annotations để tránh lỗi runtime
3. **React Query**: Cache và invalidate queries đúng cách
4. **Tailwind**: Sử dụng utility classes thay vì CSS tùy chỉnh
5. **Components**: Tách UI components nhỏ để tái sử dụng

## 📞 Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra phần Xử lý Sự cố ở trên
2. Xem logs trong console browser (F12)
3. Kiểm tra logs terminal khi chạy `npm run dev`
4. Tham khảo tài liệu trong thư mục `docs/`
5. Liên hệ team development

---

**Phiên bản**: 2.0  
**Cập nhật lần cuối**: Tháng 1, 2026
