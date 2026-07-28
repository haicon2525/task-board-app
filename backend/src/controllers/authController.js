import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// Helper hàm tạo Access Token
const generateAccessToken = (user) => {
  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "default_access_secret";
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    secret,
    { expiresIn }
  );
};

// Helper hàm tạo Refresh Token
const generateRefreshToken = (user) => {
  const secret = process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    secret,
    { expiresIn }
  );
};

/**
 * @desc    Đăng ký tài khoản người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin: name, email và password",
      });
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ email không đúng định dạng",
      });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có độ dài ít nhất 6 ký tự",
      });
    }

    // 2. Kiểm tra xem email đã tồn tại chưa
    const userCheck = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email đã tồn tại trong hệ thống",
      });
    }

    // 3. Mã hóa mật khẩu (password_hash)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Lưu người dùng vào cơ sở dữ liệu
    const newUser = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, hashedPassword]
    );

    const user = newUser.rows[0];

    // 5. Tạo cặp Access Token & Refresh Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 6. Trả về kết quả thành công
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký (register error):", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ trong quá trình đăng ký",
      error: error.message,
    });
  }
};

/**
 * @desc    Đăng nhập hệ thống
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ email và password",
      });
    }

    // 2. Tìm người dùng theo email
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const user = result.rows[0];

    // 3. So sánh mật khẩu với password_hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    // 4. Tạo cặp Access Token & Refresh Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Trả về kết quả thành công
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập (login error):", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ trong quá trình đăng nhập",
      error: error.message,
    });
  }
};

/**
 * @desc    Cấp lại Access Token mới bằng Refresh Token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp Refresh Token",
      });
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";

    // Xác thực Refresh Token
    jwt.verify(token, refreshSecret, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Refresh Token không hợp lệ hoặc đã hết hạn",
        });
      }

      // Đảm bảo người dùng vẫn tồn tại trong database
      const result = await db.query(
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      const user = result.rows[0];

      // Tạo Access Token và Refresh Token mới
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (error) {
    console.error("Lỗi cấp lại token (refresh error):", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi làm mới token",
      error: error.message,
    });
  }
};

/**
 * @desc    Đăng xuất tài khoản
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi đăng xuất",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy thông tin người dùng hiện tại
 * @route   GET /api/auth/me
 * @access  Private (Yêu cầu Access Token)
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin xác thực",
      });
    }

    const result = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng (getMe error):", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy thông tin người dùng",
      error: error.message,
    });
  }
};
