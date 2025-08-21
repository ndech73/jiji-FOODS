// server.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 4000;

// ----------------- Middleware -----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- PostgreSQL -----------------
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "jiji_foods",
  password: "your_password",
  port: 5432,
});

// ----------------- Nodemailer -----------------
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, 
  auth: {
    user: "your_email@example.com",
    pass: "your_email_password",
  },
});

// ----------------- Registration -----------------
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "Missing fields" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashed, role]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ----------------- Login -----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ----------------- Forgot Password -----------------
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour
    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expires, email]
    );

    const resetLink = `http://localhost:5500/pages/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: '"jiji FOODS" <no-reply@jiji.com>',
      to: email,
      subject: "Password Reset",
      html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reset link" });
  }
});

// ----------------- Reset Password -----------------
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Missing token or password" });

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > $2",
      [token, Date.now()]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashed, result.rows[0].id]
    );

    res.json({ message: "Password successfully reset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reset password failed" });
  }
});

// ----------------- Vendor Shop Update -----------------
app.put("/api/vendor/shop", async (req, res) => {
  const { vendor_id, shop } = req.body;
  if (!vendor_id || !shop) return res.status(400).json({ error: "Missing vendor_id or shop" });

  try {
    const result = await pool.query(
      "UPDATE vendors SET shop_name = $1 WHERE id = $2 RETURNING *",
      [shop, vendor_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Vendor not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update shop name" });
  }
});

// ----------------- Get Vendor Menu -----------------
app.get("/api/vendor/menu", async (req, res) => {
  const vendor_id = Number(req.query.vendor_id);
  if (!vendor_id) return res.status(400).json({ error: "Missing vendor_id" });

  try {
    const result = await pool.query(
      "SELECT * FROM menu WHERE vendor_id = $1 ORDER BY id ASC",
      [vendor_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load menu" });
  }
});

// ----------------- Get Vendor Orders -----------------
app.get("/api/vendor/orders", async (req, res) => {
  const vendor_id = Number(req.query.vendor_id);
  if (!vendor_id) return res.status(400).json({ error: "Missing vendor_id" });

  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE vendor_id = $1 ORDER BY id DESC",
      [vendor_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// ----------------- Start Server -----------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
