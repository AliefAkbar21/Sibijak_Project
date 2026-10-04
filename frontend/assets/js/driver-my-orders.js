// Driver assigned orders - Pengambilan Pesanan
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["driver"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  await loadMyOrders();
});

async function loadMyOrders() {
  try {
    const { orders } = await driverAPI.getAssignedOrders();
    displayOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    document.getElementById("myOrdersList").innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error_outline</span>
        <p>Gagal memuat data pesanan: ${error.message}</p>
      </div>
    `;
  }
}

function displayOrders(orders) {
  const container = document.getElementById("myOrdersList");

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">local_shipping</span>
        <p>Belum ada pesanan yang Anda terima</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
      <div class="my-order-card" style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
        <!-- Header: Nama & Badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h4 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${
              order.name
            }</h4>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${formatDate(
              order.pickup_date
            )}</div>
          </div>
          <span style="background-color: ${getStatusBadgeColor(
            order.status
          )}; color: white; font-size: 12px; padding: 6px 14px; border-radius: 20px; font-weight: 500; white-space: nowrap;">${getStatusText(
        order.status
      )}</span>
        </div>
        
        <!-- Info Details -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          <!-- Alamat (clickable/highlighted) -->
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Alamat:</div>
            <div style="font-size: 14px; color: #2563eb; font-weight: 500; text-decoration: underline; cursor: pointer;">${
              order.address
            }</div>
          </div>
          
          <!-- Jenis Sampah & Sesi dalam satu baris -->
          <div style="display: flex; gap: 32px;">
            <div style="flex: 1;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Jenis Sampah:</div>
              <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${getWasteTypeLabel(
                order.waste_type
              )}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Sesi:</div>
              <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${getSessionLabel(
                order.pickup_session
              )}</div>
            </div>
          </div>
          
          <!-- Berat -->
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Berat:</div>
            <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${
              order.weight
            } kg</div>
          </div>
          
          <!-- Total Harga -->
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Total Harga:</div>
            <div style="font-size: 14px; color: #1f2937; font-weight: 600;">Rp ${formatNumber(
              order.total_price
            )}</div>
          </div>
          
          ${
            order.notes
              ? `
          <!-- Catatan -->
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Catatan cepetan ya:</div>
            <div style="font-size: 14px; color: #1f2937;">${order.notes}</div>
          </div>
          `
              : ""
          }
        </div>

        <!-- Action Button -->
        <div>
          ${getActionButton(order)}
        </div>
      </div>
    `
    )
    .join("");

  // Add hover effects
  setTimeout(() => {
    document.querySelectorAll(".btn-action").forEach((btn) => {
      btn.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-1px)";
        this.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
      });
      btn.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      });
    });
  }, 100);
}

function getActionButton(order) {
  if (order.status === "accepted") {
    return `<button class="btn-action btn-complete" onclick="completeOrder(${order.id})" style="width: 100%; background-color: #3b82f6; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;">Selesaikan Pesanan</button>`;
  } else if (order.status === "in_progress") {
    return `<button class="btn-action btn-complete" onclick="completeOrder(${order.id})" style="width: 100%; background-color: #3b82f6; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;">Selesaikan Pesanan</button>`;
  }
  return "";
}

function getStatusBadgeColor(status) {
  const colors = {
    accepted: "#10b981",
    assigned: "#10b981",
    in_progress: "#f59e0b",
    completed: "#06b6d4",
  };
  return colors[status] || "#10b981";
}

async function startOrder(orderId) {
  if (!confirm("Mulai proses pengambilan sampah?")) return;

  try {
    await driverAPI.startOrder(orderId);
    alert("Proses pengambilan dimulai!");
    await loadMyOrders();
  } catch (error) {
    alert("Gagal memulai proses: " + error.message);
  }
}

async function completeOrder(orderId) {
  if (!confirm("Tandai pesanan ini sebagai selesai?")) return;

  try {
    await driverAPI.completeOrder(orderId);
    alert("Pesanan selesai!");
    await loadMyOrders();
  } catch (error) {
    alert("Gagal menyelesaikan pesanan: " + error.message);
  }
}

function getStatusBadgeClass(status) {
  const badges = {
    assigned: "badge-info",
    in_progress: "badge-warning",
    completed: "badge-success",
  };
  return badges[status] || "badge-info";
}

function getStatusText(status) {
  const texts = {
    accepted: "Diterima",
    assigned: "Ditugaskan",
    in_progress: "Dalam Proses",
    completed: "Selesai",
  };
  return texts[status] || status;
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

function formatNumber(num) {
  if (!num) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
