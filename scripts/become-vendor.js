document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("becomeVendorForm");
  const messageDiv = document.getElementById("formMessage");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get the logged-in user
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please log in first!");
      window.location.href = "/pages/login.html";
      return;
    }

    // Grab shop name from input
    const shopName = document.getElementById("shopName").value.trim();
    if (!shopName) {
      messageDiv.textContent = "❌ Please enter a shop name.";
      messageDiv.style.color = "red";
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/become-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, shopName }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update localStorage to reflect new vendor role
        user.role = "vendor";
        user.shop_name = shopName;
        localStorage.setItem("user", JSON.stringify(user));

        messageDiv.textContent = "🎉 You are now a vendor! Redirecting...";
        messageDiv.style.color = "green";

        setTimeout(() => {
          window.location.href = "/pages/vendor-dashboard.html";
        }, 1500);
      } else {
        messageDiv.textContent = `❌ ${data.error || "Something went wrong."}`;
        messageDiv.style.color = "red";
      }
    } catch (err) {
      console.error("Error upgrading to vendor:", err);
      messageDiv.textContent = "❌ Server error. Please try again later.";
      messageDiv.style.color = "red";
    }
  });
});
