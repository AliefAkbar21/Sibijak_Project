// Driver dashboard
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["driver"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];
  document.getElementById("driverName").textContent = user.name;

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const [availableData, assignedData, historyData] = await Promise.all([
      driverAPI.getAvailableOrders(),
      driverAPI.getAssignedOrders(),
      driverAPI.getOrderHistory(),
    ]);

    const availableOrders = availableData.orders || [];
    const assignedOrders = assignedData.orders || [];
    const historyOrders = historyData.orders || [];

    // Calculate statistics
    const inProgress = assignedOrders.filter(
      (o) => o.status === "in_progress" || o.status === "accepted"
    ).length;
    const today = new Date().toISOString().split("T")[0];
    const completedToday = historyOrders.filter(
      (o) => o.completed_at && o.completed_at.startsWith(today)
    ).length;
    const totalCompleted = historyOrders.length;

    // Update stats
    document.getElementById("availableOrders").textContent =
      availableOrders.length;
    document.getElementById("inProgressOrders").textContent = inProgress;
    document.getElementById("completedToday").textContent = completedToday;
    document.getElementById("totalCompleted").textContent = totalCompleted;

    // Display available orders (limit to 6 for dashboard)
    displayAvailableOrders(availableOrders.slice(0, 6));

    // Display recent activity logs
    displayActivityLogs([...assignedOrders, ...historyOrders].slice(0, 5));
  } catch (error) {
    console.error("Error loading dashboard:", error);
    document.getElementById("availableOrdersList").innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error_outline</span>
        <p>Gagal memuat data: ${error.message}</p>
      </div>
    `;
  }
}

function displayAvailableOrders(orders) {
  const container = document.getElementById("availableOrdersList");

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">inbox</span>
        <p>Tidak ada pesanan tersedia saat ini</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
      <div class="driver-order-card" style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border: 1px solid #f0f0f0; transition: all 0.3s ease;">
        <!-- Header: Nama & Badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 22px; font-weight: 600; color: #2d3748; flex: 1;">${
            order.name
          }</h3>
          <span style="background-color: #ff6b01; color: white; font-size: 13px; padding: 6px 16px; border-radius: 20px; font-weight: 500; white-space: nowrap; margin-left: 12px;">Pending</span>
        </div>
        
        <!-- Info Items -->
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <!-- Tanggal -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="material-icons" style="font-size: 20px; color: #718096;">calendar_today</span>
            <span style="font-size: 15px; color: #4a5568;">${formatDate(
              order.pickup_date
            )}</span>
          </div>
          
          <!-- Alamat Lengkap -->
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span class="material-icons" style="font-size: 20px; color: #718096; margin-top: 2px;">location_on</span>
            <span style="font-size: 15px; color: #4a5568;">${
              order.address
            }</span>
          </div>
          
          <!-- Jenis Sampah & Berat -->
          <div style="display: flex; gap: 24px;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
              <span class="material-icons" style="font-size: 20px; color: #718096;">delete_outline</span>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px;">Jenis Sampah</span>
                <span style="font-size: 15px; color: #2d3748; font-weight: 500; margin-top: 2px;">${getWasteTypeLabel(
                  order.waste_type
                )}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
              <span class="material-icons" style="font-size: 20px; color: #718096;">scale</span>
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px;">Berat</span>
                <span style="font-size: 15px; color: #2d3748; font-weight: 500; margin-top: 2px;">${
                  order.weight
                } kg</span>
              </div>
            </div>
          </div>
          
          <!-- Waktu/Sesi -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="material-icons" style="font-size: 20px; color: #718096;">schedule</span>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px;">Sesi</span>
              <span style="font-size: 15px; color: #2d3748; font-weight: 500; margin-top: 2px;">${getSessionLabel(
                order.pickup_session
              )} (${order.pickup_time || "08:00 - 12:00"})</span>
            </div>
          </div>
        </div>

        <!-- Total Harga -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; color: #a0aec0; margin-bottom: 4px;">Total Harga</div>
          <div style="font-size: 26px; font-weight: 700; color: #10b981;">Rp ${formatPrice(
            order.total_price
          )}</div>
        </div>

        <!-- Tombol Full Width -->
        <button class="btn-accept" onclick="acceptOrder(${order.id})" 
          style="width: 100%; display: block; background-color: #10b981; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; text-align: center; transition: all 0.3s ease;">
          Terima Pesanan
        </button>
      </div>
    `
    )
    .join("");

  // Add hover effects
  setTimeout(() => {
    document.querySelectorAll(".btn-accept").forEach((btn) => {
      btn.addEventListener("mouseenter", function () {
        this.style.backgroundColor = "#059669";
        this.style.transform = "translateY(-1px)";
        this.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
      });
      btn.addEventListener("mouseleave", function () {
        this.style.backgroundColor = "#10b981";
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      });
      btn.addEventListener("mousedown", function () {
        this.style.transform = "scale(0.98)";
      });
      btn.addEventListener("mouseup", function () {
        this.style.transform = "scale(1)";
      });
    });

    // Card hover effect
    document.querySelectorAll(".driver-order-card").forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
        this.style.transform = "translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        this.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
        this.style.transform = "translateY(0)";
      });
    });
  }, 100);
}

async function acceptOrder(orderId) {
  if (!confirm("Yakin ingin menerima pesanan ini?")) return;

  try {
    const response = await driverAPI.acceptOrder(orderId);
    if (response.warning) {
      alert(response.warning);
    }
    alert("Pesanan berhasil diterima!");
    loadDashboardData();
  } catch (error) {
    alert("Gagal menerima pesanan: " + error.message);
  }
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

function getSessionLabel(session) {
  const labels = {
    morning: "Pagi",
    afternoon: "Sore",
  };
  return labels[session] || session;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price) {
  if (!price) return "0";
  return price.toLocaleString("id-ID");
}

function displayActivityLogs(orders) {
  const container = document.getElementById("activityLogsList");

  if (!container) return; // Container doesn't exist yet

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">history</span>
        <p>Belum ada aktivitas</p>
      </div>
    `;
    return;
  }

  // Sort by updated_at or created_at descending
  const sortedOrders = orders.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);
    return dateB - dateA;
  });

  container.innerHTML = sortedOrders
    .map((order) => {
      const statusInfo = getActivityStatusInfo(order.status, order.is_urgent);
      const timeAgo = getTimeAgo(order.updated_at || order.created_at);
      const urgentBadge = order.is_urgent ? `<span style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600;">URGENT</span>` : '';

      return `
        <div class="activity-log-item" style="padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 16px; ${order.is_urgent ? 'border-left: 3px solid #ef4444;' : ''}">
          <div class="activity-icon" style="width: 40px; height: 40px; border-radius: 50%; background: ${
            statusInfo.bg
          }; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="color: ${
              statusInfo.color
            }; font-size: 20px;">${statusInfo.icon}</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; color: #1f2937; margin-bottom: 2px;">${
              statusInfo.text
            }${urgentBadge}</div>
            <div style="font-size: 13px; color: #6b7280;">Pesanan #${
              order.id
            } - ${order.name}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${timeAgo}</div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 14px; font-weight: 600; color: #10b981;">Rp ${formatPrice(
              order.total_price
            )}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function getActivityStatusInfo(status, isUrgent = false) {
  const statusMap = {
    accepted: {
      icon: "check_circle",
      text: "Pesanan Diterima",
      color: "#10b981",
      bg: "#d1fae5",
    },
    in_progress: {
      icon: "local_shipping",
      text: "Sedang Mengambil",
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    completed: {
      icon: "task_alt",
      text: "Pesanan Selesai",
      color: "#06b6d4",
      bg: "#cffafe",
    },
  };

  const info = statusMap[status] || statusMap.accepted;
  
  // Add urgent styling if applicable
  if (isUrgent && status === 'accepted') {
    info.icon = "warning";
    info.color = "#ef4444";
    info.bg = "#fee2e2";
    info.text = "Pesanan Urgent Diterima";
  }

  return info;
}

function getTimeAgo(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}