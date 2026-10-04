// Customer orders list
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["customer"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];

  try {
    const { orders } = await customerAPI.getOrders();
    displayOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    document.getElementById("ordersList").innerHTML =
      '<p class="loading-text">Gagal memuat data pesanan: ' +
      error.message +
      "</p>";
  }
});

function displayOrders(orders) {
  const container = document.getElementById("ordersList");

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <span class="material-icons">inventory_2</span>
        </div>
        <h3>Belum ada pesanan</h3>
        <p>Pesanan yang dibuat akan muncul di sini</p>
      </div>
    `;
    return;
  }

  const html = orders
    .map(
      (order) => `
    <div class="order-card">
      <div class="order-card-header">
        <div class="order-id-section">
          <span class="order-id">ORD-${String(order.id).padStart(3, "0")}</span>
          <span class="order-status-badge status-${order.status}">
            <span class="material-icons">${getStatusIcon(order.status)}</span>
            ${getStatusText(order.status)}
          </span>
          ${
            order.payment_method === "qris"
              ? `
          <span class="order-status-badge status-${
            order.payment_verified ? "completed" : "pending"
          }">
            <span class="material-icons">${
              order.payment_verified ? "verified" : "hourglass_empty"
            }</span>
            ${
              order.payment_verified
                ? "Pembayaran Terverifikasi"
                : "Menunggu Verifikasi Pembayaran"
            }
          </span>
          `
              : ""
          }
          <p class="order-date">Dipesan pada ${formatDate(order.created_at)}</p>
        </div>
        <div class="order-price-section">
          <p class="order-price-label">Total Pembayaran</p>
          <p class="order-price">Rp ${formatNumber(order.total_price)}</p>
          <p class="order-payment-method">${
            order.payment_method === "qris" ? "QRIS" : "Tunai"
          }</p>
        </div>
      </div>
      
      <div class="order-card-body">
        <div class="order-detail-item">
          <div class="order-detail-icon">
            <span class="material-icons">person</span>
          </div>
          <div class="order-detail-content">
            <p class="order-detail-label">Nama Pemesan</p>
            <p class="order-detail-value">${order.name}</p>
          </div>
        </div>
        
        <div class="order-detail-item">
          <div class="order-detail-icon">
            <span class="material-icons">delete</span>
          </div>
          <div class="order-detail-content">
            <p class="order-detail-label">Jenis Sampah</p>
            <p class="order-detail-value">${getWasteTypeLabel(
              order.waste_type
            )}</p>
          </div>
        </div>
        
        <div class="order-detail-item">
          <div class="order-detail-icon">
            <span class="material-icons">scale</span>
          </div>
          <div class="order-detail-content">
            <p class="order-detail-label">Berat</p>
            <p class="order-detail-value">${order.weight} kg</p>
          </div>
        </div>
        
        <div class="order-detail-item">
          <div class="order-detail-icon">
            <span class="material-icons">calendar_today</span>
          </div>
          <div class="order-detail-content">
            <p class="order-detail-label">Tanggal Pengambilan</p>
            <p class="order-detail-value">${formatDateOnly(
              order.pickup_date
            )}</p>
          </div>
        </div>
        
        <div class="order-detail-item">
          <div class="order-detail-icon">
            <span class="material-icons">schedule</span>
          </div>
          <div class="order-detail-content">
            <p class="order-detail-label">Sesi Waktu</p>
            <p class="order-detail-value">${getSessionLabel(
              order.pickup_session
            )}</p>
          </div>
        </div>
        
        <div class="order-detail-item">
          <div class="order-detail-icon">
            <span class="material-icons">location_on</span>
          </div>
          <div class="order-detail-content">
            <p class="order-detail-label">Alamat</p>
            <p class="order-detail-value">${order.address.substring(0, 50)}${
        order.address.length > 50 ? "..." : ""
      }</p>
          </div>
        </div>
      </div>
      
      <div class="order-card-footer">
        <button class="btn-detail" onclick="viewOrderDetail(${order.id})">
          <span class="material-icons">visibility</span>
          Lihat Detail
        </button>
      </div>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
}

function viewOrderDetail(orderId) {
  // Navigate to order detail page or show modal
  alert("Detail untuk Order ID: " + orderId);
}

function getStatusIcon(status) {
  const icons = {
    pending: "pending",
    assigned: "assignment_turned_in",
    in_progress: "local_shipping",
    completed: "check_circle",
    cancelled: "cancel",
  };
  return icons[status] || "info";
}

function getStatusText(status) {
  const texts = {
    pending: "Pending",
    assigned: "Diproses",
    in_progress: "Dalam Proses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
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
    morning: "Pagi (08:00 - 12:00)",
    afternoon: "Sore (12:00 - 16:00)",
  };
  return labels[session] || session;
}

function formatNumber(num) {
  return new Intl.NumberFormat("id-ID").format(num);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateOnly(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
