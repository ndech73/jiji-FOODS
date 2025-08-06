const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 4000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/styles", express.static(path.join(__dirname, "styles")));
app.use("/pages", express.static(path.join(__dirname, "pages")));

// ✅ PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "127.0.0.1",
  database: "jiji_foods",
  password: "Daniel_254", // replace with your actual password
  port: 5432,
});

// ✅ Email transporter (Gmail app password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "danielke254@gmail.com",
    pass: "nphilrfbbxgfsekl", // Gmail app password
  },
});

// ✅ Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: 0, errormsg: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: 0, errormsg: "Invalid email or password" });
    }

    res.json({
      success: 1,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.username || user.name || "",
        email: user.email,
        role: user.role || "customer",
      },
    });
  } catch (error) {
    res.status(500).json({ success: 0, errormsg: "Server error", error: error.message });
  }
});

// ✅ Registration route
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!["vendor", "customer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Forgot password route
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expiry, email]
    );

    const resetLink = `http://localhost:${PORT}/pages/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: '"jiji FOODS" <danielke254@gmail.com>',
      to: email,
      subject: "Reset your password",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Reset password route
app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing token or new password" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = $2",
      [hashedPassword, token]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).send("❌ Resource not found");
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
