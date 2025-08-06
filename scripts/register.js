function togglePassword(fieldId) {
  const input = document.getElementById(fieldId);
  input.type = input.type === "password" ? "text" : "password";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const messageDiv = document.getElementById("formMessage"); // ✅ This div displays the message

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;

    // Clear previous message
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

      if (response.ok) {
        messageDiv.textContent = "✅ Registration successful! Redirecting to login...";
        messageDiv.style.color = "green";

        // Delay before redirecting
        setTimeout(() => {
          window.location.href = "/pages/login.html";
        }, 2000);
      } else {
        messageDiv.textContent = `❌ ${data.error || "Registration failed"}`;
        messageDiv.style.color = "red";
      }
    } catch (err) {
      messageDiv.textContent = "❌ Server error. Please try again later.";
      messageDiv.style.color = "red";
      console.error(err);
    }
  });
});
