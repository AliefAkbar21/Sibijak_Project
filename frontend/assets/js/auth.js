// Auth utilities
function isLoggedIn() {
  return localStorage.getItem("token") !== null;
}

function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function logout() {
  clearAuth();
  window.location.href = "/frontend/pages/auth/login.html";
}

// Redirect based on role
function redirectToDashboard(role) {
  const dashboards = {
    customer: "/frontend/pages/customer/dashboard.html",
    driver: "/frontend/pages/driver/dashboard.html",
    admin: "/frontend/pages/admin/dashboard.html",
  };

  window.location.href = dashboards[role] || "/frontend/index.html";
}

// Check auth on protected pages
function requireAuth(allowedRoles = []) {
  if (!isLoggedIn()) {
    window.location.href = "/frontend/pages/auth/login.html";
    return false;
  }

  const user = getCurrentUser();
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert("Anda tidak memiliki akses ke halaman ini");
    redirectToDashboard(user.role);
    return false;
  }

  return true;
}

// Setup logout button
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Yakin ingin keluar?")) {
        logout();
      }
    });
  }
});
