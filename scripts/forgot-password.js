document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 forgot-password.js loaded!");

  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("forgotEmail");
  const message = document.getElementById("forgotMessage");

  if (!form || !emailInput || !message) {
    console.error("❌ Missing form elements. Check your HTML IDs.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    message.textContent = "Sending reset link...";

    try {
      const response = await fetch("http://localhost:4000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await response.text(); // raw response text
      console.log("💬 Raw response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("❌ JSON parse failed:", err);
        message.textContent = "Invalid response from server.";
        return;
      }

      if (response.ok) {
        message.textContent = result.message || "Reset link sent!";
        form.reset();
      } else {
        message.textContent = result.error || "Failed to send reset link.";
      }
    } catch (err) {
      console.error("❌ Request failed:", err);
      message.textContent = "An error occurred. Try again.";
    }
  });
});
