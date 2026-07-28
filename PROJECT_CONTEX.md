# 📌 PROJECT CONTEXT & ARCHITECTURE

## 🗄️ Database Schemas (PostgreSQL)

- `users`: id, name, email, password_hash, created_at
- `boards`: id, title, owner_id (FK -> users.id), created_at
- `board_members`: board_id (FK -> boards.id), user_id (FK -> users.id), role, joined_at
- `lists`: id, board_id (FK -> lists.id), title, position, created_at
- `tasks`: id, list_id (FK -> lists.id), title, description, position, assignee_id (FK -> users.id), created_at, updated_at
- `comments`: id, task_id (FK -> tasks.id), user_id (FK -> users.id), content, created_at

## 🔌 Completed Endpoints & Middlewares

- `POST /api/auth/register`: Đăng ký tài khoản (`name`, `email`, `password` -> trả về cặp `accessToken` & `refreshToken`).
- `POST /api/auth/login`: Đăng nhập bằng `email` & `password` -> trả về cặp `accessToken` & `refreshToken`.
- `POST /api/auth/refresh`: Cấp lại `accessToken` & `refreshToken` mới thông qua `refreshToken`.
- `POST /api/auth/logout`: Đăng xuất tài khoản.
- `GET /api/auth/me`: Lấy profile người dùng hiện tại (Yêu cầu `accessToken`).
- `verifyToken`: Middleware (`src/middlewares/authMiddleware.js`) trích xuất Header `Authorization: Bearer <accessToken>` và gán thông tin vào `req.user`.

## 🎯 Next Tasks:

- Viết API CRUD cho **Boards** & **Lists** (Quản lý bảng công việc và danh sách trạng thái).
- Viết API CRUD cho **Tasks** & **Comments** (Quản lý thẻ công việc & bình luận).
