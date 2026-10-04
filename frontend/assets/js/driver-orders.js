// Driver available orders
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["driver"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  await loadOrders();
});

async function loadOrders() {
  try {
    const { orders } = await driverAPI.getAvailableOrders();
    displayOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    document.getElementById("ordersList").innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error_outline</span>
        <p>Gagal memuat data pesanan: ${error.message}</p>
      </div>
    `;
  }
}

function displayOrders(orders) {
  const container = document.getElementById("ordersList");

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">inbox</span>
        <p>Tidak ada pesanan tersedia saat ini</p>
      </div>
    `;
    return;
  }

  // Sort orders: urgent orders first, then by created_at
  const sortedOrders = orders.sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1;
    if (!a.is_urgent && b.is_urgent) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  container.innerHTML = sortedOrders
    .map(
      (order) => `
      <div class="driver-order-card" style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border: 1px solid #f0f0f0; transition: all 0.3s ease;">
        ${
          order.is_urgent
            ? `
        <!-- Urgent Banner -->
        <div style="margin-bottom: 16px; padding: 12px 16px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 8px; display: flex; align-items: center; gap: 10px; border-left: 4px solid #b91c1c;">
          <span class="material-icons" style="font-size: 24px; color: white;">warning</span>
          <div>
            <div style="color: white; font-size: 15px; font-weight: 600;">PESANAN URGENT - LINTAS WILAYAH</div>
            <div style="color: #fecaca; font-size: 13px; margin-top: 2px;">Anda ditetapkan untuk mengambil pesanan ini karena urgent</div>
          </div>
        </div>
        `
            : ""
        }
        
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
          
          <!-- Lokasi/Region -->
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span class="material-icons" style="font-size: 20px; color: #718096; margin-top: 2px;">location_on</span>
            <span style="font-size: 15px; color: #4a5568;">Larangan, cipadu</span>
          </div>
          
          <!-- Alamat Lengkap -->
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span class="material-icons" style="font-size: 20px; color: #718096; margin-top: 2px;">place</span>
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
          <div style="font-size: 26px; font-weight: 700; color: #10b981;">Rp ${formatNumber(
            order.total_price
          )}</div>
        </div>

        ${
          order.status === "assigned"
            ? `
        <!-- Badge for Admin Assigned -->
        <div style="margin-bottom: 12px; padding: 10px 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; gap: 8px;">
          <span class="material-icons" style="font-size: 18px; color: white;">admin_panel_settings</span>
          <span style="color: white; font-size: 13px; font-weight: 500;">Ditugaskan oleh Admin</span>
        </div>
        `
            : ""
        }
        
        <!-- Tombol Terima Pesanan -->
        <button class="btn-accept" onclick="acceptOrder(${order.id})" 
          style="width: 100%; display: block; background-color: #10b981; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; text-align: center; transition: all 0.3s ease;">
          Terima Pesanan
        </button>
      </div>
    `
    )
    .join("");

  // Add hover effects to buttons and cards
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
  if (!confirm("Anda yakin ingin menerima pesanan ini?")) return;

  try {
    const result = await driverAPI.acceptOrder(orderId);
    let message = "Pesanan berhasil diterima!";
    if (result.warning) {
      message += "\n\nPeringatan: " + result.warning;
    }
    alert(message);
    await loadOrders();
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

function formatNumber(num) {
  if (!num) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
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