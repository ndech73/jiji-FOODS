document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetForm");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const message = document.getElementById("resetMessage");

  // ✅ Get token from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    message.textContent = "Invalid or missing token.";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!newPassword || !confirmPassword) {
      message.textContent = "Please fill in all fields.";
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const resultText = await response.text();
      let result;

      try {
        result = JSON.parse(resultText);
      } catch (err) {
        console.error("❌ Failed to parse server response:", err);
        message.textContent = "Unexpected server response.";
        return;
      }

      if (response.ok) {
        message.textContent = result.message || "Password reset successful.";
        form.reset();
      } else {
        message.textContent = result.error || "Failed to reset password.";
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      message.textContent = "Network error. Please try again.";
    }
  });
});
