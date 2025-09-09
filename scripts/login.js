    
   
    document.addEventListener("submit", function(e) {
  e.preventDefault();
  e.stopPropagation();
  alert("🛑 Global submit blocked!");
}, true);


    document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const togglePassword = document.querySelector("#togglePassword");
  const passwordInput = document.querySelector("#password");
  const errorMessage = document.getElementById("error-message");

  if (!form) {
    console.error("❌ Login form not found!");
    return;
  }

  console.log("✅ Login JS loaded and form handler attached");

  // ✅ Toggle password visibility
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      togglePassword.textContent = type === "password" ? "👁" : "🙈";
    });
  }

  // ✅ Handle login form submission
  form.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🚀 Login form submit intercepted (no reload)");
    errorMessage.textContent = "";

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();


   const emailField = document.querySelector("#email");
console.log("📧 Email field element:", emailField);
console.log("📧 Email value at submit:", emailField.value);


    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("🌐 Raw response:", response);

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("❌ Response was not JSON. Status: " + response.status);
      }

      console.log("✅ Server responded with:", data);

      if (!response.ok || !data.user) {
        throw new Error(data.error || "Invalid credentials");
      }

      // ✅ Save full user object
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user.role.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

      if (role === "vendor") {
        localStorage.setItem("vendorName", data.user.name);
        localStorage.setItem("vendorEmail", data.user.email);
        localStorage.setItem("vendorShop", data.user.shop || "");
        window.location.href = "/pages/vendor-dashboard.html";
      } else if (role === "customer") {
        localStorage.setItem("customerName", data.user.name);
        localStorage.setItem("customerEmail", data.user.email);

        if (redirect === "cart") {
          window.location.href = "/pages/customer-dashboard.html#cart";
        } else {
          window.location.href = "/pages/customer-dashboard.html";
        }
      } else {
        errorMessage.textContent =
          "Unknown user role. Please contact support.";
      }
    } catch (error) {
      console.error("❌ Login error:", error.message);
      errorMessage.textContent = "Login failed: " + error.message;
    }
  });
});
