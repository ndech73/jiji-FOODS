// vendor-dashboard.js

const API_BASE = "http://localhost:4000";

// ✅ Get vendor info from login
const vendor = JSON.parse(localStorage.getItem("user"));
const vendor_id = Number(vendor?.id);

if (!vendor_id) {
  alert("⚠️ Session expired. Please log in again.");
  window.location.href = "/pages/login.html";
}


// =======================
// Populate profile
// =======================
function populateProfile() {
  const nameEl = document.getElementById("vendor-name");
  const emailEl = document.getElementById("vendor-email");
  const shopInput = document.getElementById("shop-name-input");

  if (vendor?.name && nameEl) nameEl.textContent = vendor.name;
  if (vendor?.email && emailEl) emailEl.textContent = vendor.email;
  if (vendor?.shop_name && shopInput) shopInput.value = vendor.shop_name;
}

// =======================
// Load Vendor Menu
// =======================
async function loadMenu() {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/menu?vendor_id=${vendor_id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const menuList = document.getElementById("menu-list");
    if (menuList) {
      menuList.innerHTML = data.map(item => `<div>${item.name} - Ksh ${item.price}</div>`).join("");
    }
  } catch (err) {
    console.error("Error loading menu:", err);
  }
}

// =======================
// Load Vendor Orders
// =======================
async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/api/vendor/orders?vendor_id=${vendor_id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const orderList = document.getElementById("order-list");
    if (orderList) {
      orderList.innerHTML = data.map(order => `<div>Order #${order.id} - ${order.status}</div>`).join("");
    }
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// =======================
// Save Shop Name
// =======================
document.addEventListener("DOMContentLoaded", () => {
  populateProfile();
  loadMenu();
  loadOrders();

  const saveBtn = document.getElementById("save-shop-btn");
  if (!saveBtn) return;

  saveBtn.type = "button";
  saveBtn.replaceWith(saveBtn.cloneNode(true));
  const freshSaveBtn = document.getElementById("save-shop-btn");

  let savingShop = false;
  freshSaveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (savingShop) return;
    savingShop = true;

    const shopInput = document.getElementById("shop-name-input");
    const shop = shopInput?.value.trim();
    const vendorNameEl = document.getElementById("vendor-name");

    if (!shop) {
      alert("Enter a shop name");
      savingShop = false;
      return;
    }

    freshSaveBtn.disabled = true;
    freshSaveBtn.textContent = "Saving...";

    try {
      console.log("🛠 Sending payload:", { vendor_id, shop });

      const res = await fetch(`${API_BASE}/api/vendor/shop`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id, shop }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      console.log("Backend response:", result);

      // ✅ Correct update
      vendor.shop_name = result.shop_name;
      localStorage.setItem("user", JSON.stringify(vendor));

      if (vendorNameEl) vendorNameEl.textContent = vendor.name;
      if (shopInput) shopInput.value = vendor.shop_name;

      freshSaveBtn.textContent = "✔ Saved";
      setTimeout(() => {
        freshSaveBtn.textContent = "Save Shop Name";
        freshSaveBtn.disabled = false;
      }, 1200);
    } catch (err) {
      console.error("Error saving shop name:", err);
      freshSaveBtn.textContent = "Save Shop Name";
      freshSaveBtn.disabled = false;
    } finally {
      savingShop = false;
    }
  });
});

// =======================
// Logout
// =======================
function logout() {
  localStorage.removeItem("user");
  alert("You have been logged out.");
  window.location.href = "/pages/login.html";
}
document.getElementById("logout-btn")?.addEventListener("click", logout);
