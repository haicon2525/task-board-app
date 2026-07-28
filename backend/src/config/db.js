import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Lỗi kết nối database", err.stack);
  }

  console.log("Kết nối database thành công");
  release();
});

export default {
  query: (text, params) => pool.query(text, params),
};
