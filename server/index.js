import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+09:00",
});

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(50) PRIMARY KEY,
        memberNo VARCHAR(20),
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        region VARCHAR(20),
        branch VARCHAR(50),
        carNo VARCHAR(30),
        joinDate VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        address TEXT,
        birthDate VARCHAR(20),
        notes TEXT,
        createdAt VARCHAR(20)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS funeral_records (
        id VARCHAR(50) PRIMARY KEY,
        memberId VARCHAR(50),
        memberName VARCHAR(50),
        type VARCHAR(10),
        deceasedName VARCHAR(50),
        relation VARCHAR(30),
        date VARCHAR(20),
        amount INT DEFAULT 0,
        notes TEXT,
        createdAt VARCHAR(20)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("DB 연결 및 테이블 초기화 완료");
  } finally {
    conn.release();
  }
}

// --- 회원 API ---
app.get("/api/members", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM members ORDER BY createdAt DESC");
  res.json(rows);
});

app.post("/api/members", async (req, res) => {
  const m = req.body;
  await pool.query(
    "INSERT INTO members (id,memberNo,name,phone,region,branch,carNo,joinDate,status,address,birthDate,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE memberNo=VALUES(memberNo),name=VALUES(name),phone=VALUES(phone),region=VALUES(region),branch=VALUES(branch),carNo=VALUES(carNo),joinDate=VALUES(joinDate),status=VALUES(status),address=VALUES(address),birthDate=VALUES(birthDate),notes=VALUES(notes)",
    [m.id, m.memberNo, m.name, m.phone, m.region, m.branch, m.carNo, m.joinDate, m.status, m.address, m.birthDate, m.notes, m.createdAt]
  );
  res.json({ ok: true });
});

app.delete("/api/members/:id", async (req, res) => {
  await pool.query("DELETE FROM members WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

// --- 장제·성조 API ---
app.get("/api/funeral", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM funeral_records ORDER BY date DESC");
  res.json(rows);
});

app.post("/api/funeral", async (req, res) => {
  const r = req.body;
  await pool.query(
    "INSERT INTO funeral_records (id,memberId,memberName,type,deceasedName,relation,date,amount,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [r.id, r.memberId, r.memberName, r.type, r.deceasedName, r.relation, r.date, r.amount, r.notes, r.createdAt]
  );
  res.json({ ok: true });
});

app.delete("/api/funeral/:id", async (req, res) => {
  await pool.query("DELETE FROM funeral_records WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

// --- 로그인 ---
app.post("/api/auth/login", (req, res) => {
  const { id, password } = req.body;
  if (id === "admin" && password === "jilreon2024") {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }
});

// --- 헬스체크 ---
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.API_PORT || 3001;
initDB()
  .then(() => app.listen(PORT, () => console.log(`API 서버 실행중 :${PORT}`)))
  .catch(err => { console.error("DB 초기화 실패:", err.message); process.exit(1); });
