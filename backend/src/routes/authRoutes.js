import express from "express";
import { register, login, refreshToken, logout, getMe } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route Đăng ký: POST /api/auth/register
router.post("/register", register);

// Route Đăng nhập: POST /api/auth/login
router.post("/login", login);

// Route Làm mới token: POST /api/auth/refresh
router.post("/refresh", refreshToken);

// Route Đăng xuất: POST /api/auth/logout
router.post("/logout", logout);

// Route Lấy thông tin tài khoản: GET /api/auth/me (Yêu cầu Access Token)
router.get("/me", verifyToken, getMe);

export default router;
