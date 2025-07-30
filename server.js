const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = 4000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "127.0.0.1",
  database: "jiji_foods",
  password: "Daniel_254", // 🔒 Replace with your actual password
  port: 5432,
});

// ✅ Login route (no bcrypt, raw comparison)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email);
  console.log("🔑 Entered password:", password);

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      console.log("❌ No user found for email:", email);
      return res.status(401).json({ success: 0, errormsg: "Invalid email or password" });
    }

    const user = result.rows[0];
    console.log("🔐 Stored password from DB:", user.password);

    // ⚠️ TEMPORARY: raw password check (no hashing)
    if (password !== user.password) {
      console.log("❌ Passwords don't match (raw check)");
      return res.status(401).json({ success: 0, errormsg: "Invalid email or password" });
    }

    console.log("✅ Raw password match");

    res.json({
      success: 1,
      message: "Login successful (raw check)",
      user: {
        id: user.id,
        name: user.username || user.name || "",
        email: user.email,
        role: user.role || "customer",
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: 0, errormsg: "Server error", error: error.message });
  }
});

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, "pages")));

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
