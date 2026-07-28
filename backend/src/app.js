import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Task Board API is running...");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

