// customer-dashboard.js

// ✅ Show the correct section
function showSection(sectionId) {
    document.querySelectorAll("main section").forEach(sec => {
        sec.classList.remove("active");
    });
    document.getElementById(sectionId).classList.add("active");
}

function showSection(sectionId) {
  document.querySelectorAll("main section").forEach(section => {
    section.classList.remove("active");
  });
  document.getElementById(sectionId).classList.add("active");
}

// On page load, check for hash (#cart, #orders, etc.)
document.addEventListener("DOMContentLoaded", () => {
  const section = window.location.hash.substring(1); // e.g. "cart"
  if (section) {
    showSection(section);
  }
});


// ✅ Logout and redirect
function logout() {
    localStorage.removeItem("user");
    alert("You have been logged out.");
    window.location.href = "/pages/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    // ✅ Load customer info from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.role || user.role.toLowerCase() !== "customer") {
        // If not logged in, redirect to login
        window.location.href = "/pages/login.html";
        return;
    }

    // Set profile info
    document.getElementById("customer-name").textContent = user.name;
    document.getElementById("customer-email").textContent = user.email;

    // if landing with cart, show cart
    const section = window.location.hash.substring(1); 
    if (section) {
        showSection(section);
    }

    // ✅ Find Vendors button click
    document.getElementById("find-vendors-btn").addEventListener("click", () => {
        fetchVendors();
    });

    // ✅ Checkout button click
    document.getElementById("checkout-btn").addEventListener("click", () => {
        alert("Checkout feature coming soon!");
    });

    // Load orders (optional for now)
    loadOrders();
});

// 🛠 Placeholder: Fetch vendors from backend
function fetchVendors() {
    fetch("/api/vendors") // Adjust backend route
        .then(res => res.json())
        .then(vendors => {
            const vendorsList = document.getElementById("vendors-list");
            vendorsList.innerHTML = "";

            vendors.forEach(vendor => {
                const div = document.createElement("div");
                div.classList.add("vendor-card");
                div.innerHTML = `
                    <h3>${vendor.name}</h3>
                    <p>${vendor.location}</p>
                    <button onclick="loadMenu(${vendor.id})">View Menu</button>
                `;
                vendorsList.appendChild(div);
            });
        })
        .catch(err => console.error("Error fetching vendors:", err));
}

// 🛠 Placeholder: Load vendor's menu
function loadMenu(vendorId) {
    fetch(`/api/vendors/${vendorId}/menu`)
        .then(res => res.json())
        .then(menuItems => {
            const menuContainer = document.getElementById("menu-items");
            menuContainer.innerHTML = "";

            menuItems.forEach(item => {
                const div = document.createElement("div");
                div.classList.add("menu-item");
                div.innerHTML = `
                    <h4>${item.name} - Ksh ${item.price}</h4>
                    <button onclick="addToCart('${item.name}', ${item.price})">Add to Cart</button>
                `;
                menuContainer.appendChild(div);
            });
        })
        .catch(err => console.error("Error loading menu:", err));
}

// ✅ Cart logic
let cart = [];

function addToCart(name, price) {
    cart.push({ name, price });
    displayCart();
}

function displayCart() {
    const cartContainer = document.getElementById("cart-items");
    cartContainer.innerHTML = "";
    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            ${item.name} - Ksh ${item.price} 
            <button onclick="removeFromCart(${index})">❌</button>
        `;
        cartContainer.appendChild(div);
    });
}

function removeFromCart(index) {
    cart.splice(index, 1);
    displayCart();
}

// 🛠 Placeholder: Load orders
// 🛠 Placeholder: Load orders
function loadOrders() {
    fetch("/api/orders")
        .then(res => res.json())
        .then(orders => {
            if (!Array.isArray(orders)) {
                console.error("❌ Orders API did not return an array:", orders);
                return;
            }

            const ordersList = document.getElementById("orders-list");
            ordersList.innerHTML = "";

            orders.forEach(order => {
                const div = document.createElement("div");
                div.classList.add("order-card");
                div.innerHTML = `
                    <h4>Order #${order.id}</h4>
                    <p>Status: ${order.status}</p>
                    <p>Customer: ${order.customer_name}</p>
                `;
                ordersList.appendChild(div);
            });
        })
        .catch(err => console.error("Error loading orders:", err));
}
