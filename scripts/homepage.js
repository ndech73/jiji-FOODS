// highlight the active nav link based on the current page
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll("nav ul li a");
  const currentPage = window.location.pathname.split("/").pop();

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });

  // ✅ Cart button logic
  const cartLink = document.getElementById("cartLink");
  if (cartLink) {
    cartLink.addEventListener("click", (e) => {
      e.preventDefault();

      const user = JSON.parse(localStorage.getItem("user"));

      if (user) {
        // Go to customer dashboard cart
        window.location.href = "/pages/customer-dashboard.html#cart";
      } else {
        // Redirect to login with "cart" flag
        window.location.href = "/pages/login.html?redirect=cart";
      }
    });
  }

  // Example: Toggle header shadow on scroll
  const header = document.querySelector("header");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 10) {
      header.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
    } else {
      header.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
    }
  });
});

// hero slider functionality
document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".hero-slider .slide");
  let current = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  setInterval(() => {
    current = (current + 1) % slides.length;
    showSlide(current);
  }, 2000); // change the image every 2 seconds
});

document.addEventListener("DOMContentLoaded", () => {
  const myShopBtn = document.getElementById("myShopBtn");

  if (!myShopBtn) return;

  myShopBtn.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      // Not logged in → go to login page
      window.location.href = "/pages/login.html";
      return;
    }

    if (user.role === "vendor") {
      // Already a vendor → go to vendor dashboard
      window.location.href = "/pages/vendor-dashboard.html";
    } else {
      // Not a vendor → go to become-vendor page
      window.location.href = "/pages/become-vendor.html";
    }
  });
});
