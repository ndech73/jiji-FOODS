document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const messageDiv = document.getElementById("formMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;

    messageDiv.textContent = "";
    messageDiv.style.color = "";

    if (password !== confirmPassword) {
      messageDiv.textContent = "❌ Passwords do not match!";
      messageDiv.style.color = "red";
      return;
    }

    if (!role) {
      messageDiv.textContent = "❌ Please select a role.";
      messageDiv.style.color = "red";
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        messageDiv.textContent = `❌ ${data.error || "Registration failed"}`;
        messageDiv.style.color = "red";
        return;
      }

      // Save user only if backend returned it
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      messageDiv.textContent = "✅ Registration successful! Redirecting...";
      messageDiv.style.color = "green";

      setTimeout(() => {
        if (role === "vendor") {
          // If vendor registration requires shop setup, redirect to become-vendor
          window.location.href = "/pages/become-vendor.html";
        } else {
          window.location.href = "/pages/customer-dashboard.html";
        }
      }, 1500);

    } catch (err) {
      console.error("Registration error:", err);
      messageDiv.textContent = "❌ Server error. Please try again later.";
      messageDiv.style.color = "red";
    }
  });
});
