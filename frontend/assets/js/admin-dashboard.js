// Admin dashboard
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["admin"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];

  try {
    // Load dashboard data in parallel
    const [dashboardData, allOrders, drivers] = await Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getAllOrders(),
      adminAPI.getUsers("driver"),
    ]);

    // Update stats from backend
    document.getElementById("totalOrders").textContent =
      dashboardData.total_orders;
    document.getElementById("completedOrders").textContent =
      dashboardData.completed_orders;
    document.getElementById("pendingOrders").textContent =
      dashboardData.pending_orders;

    // Calculate cancelled orders from all orders
    const cancelledOrders = allOrders.filter(
      (o) => o.status === "cancelled"
    ).length;
    document.getElementById("cancelledOrders").textContent = cancelledOrders;

    // Display recent orders (top 5 for dashboard)
    displayRecentOrders(allOrders.slice(0, 5));

    // Display active drivers (top 5)
    displayActiveDrivers(drivers.slice(0, 5), allOrders);
  } catch (error) {
    console.error("Error loading dashboard:", error);
    alert("Gagal memuat data dashboard: " + error.message);
  }
});

function displayRecentOrders(orders) {
  const container = document.getElementById("recentOrdersList");

  if (orders.length === 0) {
    container.innerHTML =
      '<div class="empty-state-small">Belum ada pesanan hari ini</div>';
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
        <div class="order-item">
          <div class="order-item-header">
            <div class="order-item-id">
              <span class="order-number">ORD-${String(order.id).padStart(
                3,
                "0"
              )}</span>
              <span class="badge badge-${getStatusClass(
                order.status
              )}">${getStatusLabel(order.status)}</span>
            </div>
            <span class="order-item-name">${
              order.customer_name || order.name
            }</span>
          </div>
          <div class="order-item-details">
            <div class="order-item-detail">
              <span class="material-icons">schedule</span>
              <span>${
                order.pickup_session === "morning" ? "Pagi" : "Sore"
              } • ${formatTime(order.created_at)}</span>
            </div>
          </div>
        </div>
    `
    )
    .join("");
}

function displayActiveDrivers(drivers, allOrders) {
  const container = document.getElementById("activeDriversList");

  // Filter verified drivers only
  const verifiedDrivers = drivers.filter((d) => d.is_verified);

  if (verifiedDrivers.length === 0) {
    container.innerHTML =
      '<div class="empty-state-small">Belum ada driver aktif</div>';
    return;
  }

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  container.innerHTML = verifiedDrivers
    .map((driver) => {
      // Count completed orders today for this driver
      const completedToday = allOrders.filter((order) => {
        const orderDate = new Date(order.created_at)
          .toISOString()
          .split("T")[0];
        return (
          order.driver_id === driver.id &&
          order.status === "completed" &&
          orderDate === today
        );
      }).length;

      // Count in progress orders
      const inProgress = allOrders.filter((order) => {
        return (
          order.driver_id === driver.id &&
          (order.status === "assigned" || order.status === "in_progress")
        );
      }).length;

      const statusClass = inProgress > 0 ? "status-active" : "status-idle";
      const statusText = inProgress > 0 ? "Aktif" : "Istirahat";

      return `
        <div class="driver-item">
          <div class="driver-avatar">
            <span class="material-icons">person</span>
          </div>
          <div class="driver-info">
            <h4>${driver.name}</h4>
            <p class="driver-vehicle">${
              driver.vehicle_number || "B 7777 VON"
            }</p>
          </div>
          <div class="driver-stats">
            <div class="driver-order-count">${completedToday}</div>
            <div class="driver-order-label">pesanan</div>
          </div>
          <div class="driver-status ${statusClass}">${statusText}</div>
        </div>
      `;
    })
    .join("");
}

function getWasteTypeLabel(type) {
  const labels = {
    paper: "Kertas",
    glass: "Kaca",
    organic: "Organik",
    plastic: "Plastik",
  };
  return labels[type] || type;
}

function getStatusLabel(status) {
  const labels = {
    pending: "Menunggu",
    assigned: "Diterima",
    in_progress: "Proses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return labels[status] || status;
}

function getStatusClass(status) {
  const classes = {
    pending: "warning",
    assigned: "info",
    in_progress: "primary",
    completed: "success",
    cancelled: "danger",
  };
  return classes[status] || "secondary";
}

function getSessionLabel(session) {
  const labels = {
    morning: "Pagi",
    afternoon: "Sore",
    both: "Pagi & Sore",
  };
  return labels[session] || session;
}

function formatNumber(num) {
  return new Intl.NumberFormat("id-ID").format(num);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
