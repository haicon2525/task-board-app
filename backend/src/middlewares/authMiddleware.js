import jwt from "jsonwebtoken";

/**
 * Middleware xác thực JWT Token từ Header Authorization
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Không tìm thấy token xác thực (Truy cập bị từ chối)",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "default_access_secret";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
