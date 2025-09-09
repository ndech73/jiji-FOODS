// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
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

app.use("/pages", express.static(path.join(__dirname, "pages")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/styles", express.static(path.join(__dirname, "styles")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/images", express.static(path.join(__dirname, "images")));

// Default route -> homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "homepage.html"));
});


// ----------------- PostgreSQL -----------------
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "jiji_foods",
  password: "Daniel_254",
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

// ----------------- REGISTRATION -----------------
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert new user
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, "customer"]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});


// ----------------- Login -----------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("📩 Login attempt:", email);

  if (!email || !password) {
    console.log("⚠️ Missing email or password");
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      console.log("❌ No user found for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log("❌ Wrong password for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful for", email);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("🔥 Login server error:", err);
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

// ----------------- Orders API -----------------
app.get("/api/orders", async (req, res) => {
  try {
    // Use id for ordering since created_at does not exist
    const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
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

app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "vendor-dashboard.html"));
});

// ---------------- Check if user is vendor ----------------
app.get("/api/check-vendor/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const isVendor = result.rows[0].role === "vendor";
    res.json({ isVendor });
  } catch (err) {
    console.error("Error checking vendor:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ---------------- Become Vendor ----------------
app.post("/api/become-vendor", async (req, res) => {
  const { userId, shopName } = req.body;

  if (!userId || !shopName) {
    return res.status(400).json({ error: "Missing userId or shopName" });
  }

  try {
    await pool.query(
      "UPDATE users SET role = 'vendor', shop_name = $1 WHERE id = $2",
      [shopName, userId]
    );

    res.json({ message: "You are now a vendor!" });
  } catch (err) {
    console.error("Error upgrading user to vendor:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ----------------- Start Server -----------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
