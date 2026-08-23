/**
 * 전일련 회원관리 시스템 — 가비아 MySQL API 서버 (Node.js)
 *
 * 사용법:
 *   node backend/server.cjs
 *
 * PM2 영구실행:
 *   pm2 start backend/server.cjs --name jil-api
 */

const express = require("express");
const cors    = require("cors");
const mysql   = require("mysql2/promise");

const PORT    = process.env.PORT    || 3001;
const DB_HOST = process.env.DB_HOST || "my8003.gabiadb.com";
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
const DB_NAME = process.env.DB_NAME || "cargouser";
const DB_USER = process.env.DB_USER || "cargouser";
const DB_PASS = process.env.DB_PASS || "@h13687413";

const pool = mysql.createPool({
  host:            DB_HOST,
  port:            DB_PORT,
  database:        DB_NAME,
  user:            DB_USER,
  password:        DB_PASS,
  charset:         "utf8mb4",
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout:  10000,
});

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS jil_app_data (
        key_name   VARCHAR(100) NOT NULL PRIMARY KEY,
        data       LONGTEXT     NOT NULL,
        updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ DB 테이블 준비 완료");
  } finally {
    conn.release();
  }
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, version: "1.0", time: new Date().toISOString() });
});

app.get("/api/:key", async (req, res) => {
  const key = req.params.key;
  if (!["members", "admins"].includes(key)) return res.status(400).json({ ok: false, error: "Invalid key" });
  try {
    const [rows] = await pool.execute("SELECT data FROM jil_app_data WHERE key_name = ?", [key]);
    const row = rows[0];
    res.json(row ? JSON.parse(row.data) : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/:key", async (req, res) => {
  const key = req.params.key;
  if (!["members", "admins"].includes(key)) return res.status(400).json({ ok: false, error: "Invalid key" });
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: "Expected JSON array" });
  try {
    const json = JSON.stringify(data);
    await pool.execute(
      "INSERT INTO jil_app_data (key_name, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()",
      [key, json]
    );
    res.json({ ok: true, saved: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 전일련 API 서버: http://localhost:${PORT}`);
    console.log(`   DB: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  });
}).catch(err => {
  console.error("❌ DB 초기화 실패:", err.message);
  process.exit(1);
});
