document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const togglePassword = document.querySelector("#togglePassword");
  const passwordInput = document.querySelector("#password");

  // Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.classList.toggle("fa-eye-slash");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("🌐 Response status:", response.status);
      console.log("✅ Server responded with:", data);

      if (!response.ok || data.success === 0) {
        throw new Error(data.errormsg || "Login failed");
      }

      // Save user info locally
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      const role = data.user.role.toLowerCase();
      if (role === "vendor") {
        window.location.href = "../pages/vendor-dashboard.html";
      } else {
        window.location.href = "../pages/customer-dashboard.html";
      }
    } catch (error) {
      console.error("❌ Login error:", error.message);
      alert("Login failed: " + error.message);
    }
  });
});
