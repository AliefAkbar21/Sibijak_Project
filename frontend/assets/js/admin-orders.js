// Admin orders management
let allOrders = [];
let allDrivers = [];
let currentOrderId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["admin"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name;

  // Filter tabs event listeners
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      // Remove active from all tabs
      document
        .querySelectorAll(".filter-tab")
        .forEach((t) => t.classList.remove("active"));
      // Add active to clicked tab
      e.target.classList.add("active");
      // Load orders with selected filter
      loadOrders();
    });
  });

  document.getElementById("refreshBtn").addEventListener("click", loadOrders);

  // Modal close buttons
  document.querySelectorAll(".close").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });
  document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeAllModals);
  document
    .getElementById("cancelAssignBtn")
    .addEventListener("click", closeAllModals);
  document
    .getElementById("cancelRejectBtn")
    .addEventListener("click", closeAllModals);

  // Modal action buttons
  document
    .getElementById("confirmAssignBtn")
    .addEventListener("click", confirmAssignDriver);
  document
    .getElementById("confirmRejectBtn")
    .addEventListener("click", confirmRejectOrder);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  // Load initial data
  await loadDrivers();
  await loadOrders();
});

async function loadOrders() {
  // Get active filter tab
  const activeTab = document.querySelector(".filter-tab.active");
  const statusFilter = activeTab ? activeTab.dataset.status : "";

  try {
    allOrders = await adminAPI.getAllOrders(statusFilter);
    displayOrders(allOrders);
  } catch (error) {
    console.error("Error loading orders:", error);
    alert("Gagal memuat pesanan: " + error.message);
  }
}

async function loadDrivers() {
  try {
    allDrivers = await adminAPI.getUsers("driver");
    // Filter only verified drivers
    allDrivers = allDrivers.filter((d) => d.is_verified);
  } catch (error) {
    console.error("Error loading drivers:", error);
  }
}

function displayOrders(orders) {
  const ordersGrid = document.getElementById("ordersGrid");

  if (orders.length === 0) {
    ordersGrid.innerHTML =
      '<p class="no-data">Tidak ada pesanan untuk ditampilkan</p>';
    return;
  }

  ordersGrid.innerHTML = orders
    .map(
      (order) => `
        <div class="admin-order-card">
          <div class="order-card-header">
            <div class="order-number">ORD-${String(order.id).padStart(
              3,
              "0"
            )}</div>
            <span class="badge badge-${getStatusClass(
              order.status
            )}">${getStatusLabel(order.status)}</span>
          </div>
          
          <div class="order-card-content">
            <div class="order-card-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="material-icons">person</span>
                  <span>${order.customer_name || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="material-icons">phone</span>
                  <span>${order.phone || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="material-icons">location_on</span>
                  <span>${(order.address || "N/A").substring(0, 30)}${
        (order.address || "").length > 30 ? "..." : ""
      }</span>
                </div>
                <div class="info-item">
                  <span class="material-icons">calendar_today</span>
                  <span>${formatDate(order.pickup_date)}</span>
                </div>
                <div class="info-item">
                  <span class="material-icons">schedule</span>
                  <span>${
                    order.pickup_time || getSessionLabel(order.pickup_session)
                  }</span>
                </div>
                <div class="info-item">
                  <span class="material-icons">delete</span>
                  <span>${getWasteTypeLabel(order.waste_type)} • ${
        order.weight
      } kg</span>
                </div>
              </div>
            </div>
            
            <div class="order-card-actions">
              <button class="btn btn-info btn-sm" onclick="viewOrderDetail(${
                order.id
              })">
                Detail
              </button>
              ${
                order.status === "pending" &&
                order.payment_method === "qris" &&
                !order.payment_verified
                  ? `
                  <button class="btn btn-success btn-sm" onclick="verifyPayment(${order.id})">
                    Verifikasi
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="rejectPayment(${order.id})">
                    Tolak
                  </button>
                  `
                  : order.status === "pending"
                  ? `
                  <button class="btn btn-success btn-sm" onclick="openAssignModal(${order.id})">
                    Setujui
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="openRejectModal(${order.id})">
                    Tolak
                  </button>
                  `
                  : ""
              }
            </div>
          </div>
        </div>
    `
    )
    .join("");
}

function viewOrderDetail(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  const driver = order.driver_id
    ? allDrivers.find((d) => d.id === order.driver_id)
    : null;

  const detailHtml = `
    <div class="modal-order-header">
      <h2>Detail Pesanan<br><span class="order-id">ORD-${String(
        order.id
      ).padStart(3, "0")}</span></h2>
      <span class="badge badge-${getStatusClass(
        order.status
      )}">${getStatusLabel(order.status)}</span>
    </div>

    <div class="modal-section">
      <div class="section-title">
        <span class="material-icons">person</span>
        Informasi Pelanggan
      </div>
      <div class="section-content">
        <div class="info-row">
          <span class="label">Nama:</span>
          <span class="value">${order.customer_name || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="label">Telepon:</span>
          <span class="value">${order.phone || "N/A"}</span>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <div class="section-title">
        <span class="material-icons">location_on</span>
        Lokasi Pengambilan
      </div>
      <div class="section-content">
        <div class="info-row">
          <span class="label">Domisili:</span>
          <span class="value domicile-badge">${
            order.domicile || "Tidak Ditentukan"
          }</span>
        </div>
        <div class="location-name">${order.address.split(",")[0] || "N/A"}</div>
        <div class="location-address">${order.address}</div>
      </div>
    </div>

    <div class="modal-section">
      <div class="section-title">
        <span class="material-icons">receipt_long</span>
        Detail Pesanan
      </div>
      <div class="section-content">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Jenis Sampah:</span>
            <span class="value">${getWasteTypeLabel(order.waste_type)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Perkiraan Berat:</span>
            <span class="value">${order.weight} kg</span>
          </div>
          <div class="detail-item">
            <span class="label">Tanggal:</span>
            <span class="value">${formatDate(order.pickup_date)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Waktu:</span>
            <span class="value">${
              order.pickup_time || getSessionLabel(order.pickup_session)
            }</span>
          </div>
        </div>
      </div>
    </div>

    ${
      order.payment_method === "qris" && order.payment_proof
        ? `
    <div class="modal-section">
      <div class="section-title">
        <span class="material-icons">image</span>
        Foto Bukti Pembayaran
      </div>
      <div class="section-content">
        <div class="payment-proof-grid">
          <img src="${
            order.payment_proof
          }" alt="Bukti Pembayaran" class="payment-proof-thumb" onclick="openPaymentProofModal('${order.payment_proof.replace(
            /'/g,
            "\\'"
          )}')">
        </div>
        ${
          !order.payment_verified
            ? `<p class="payment-status-note">Status: <span class="badge badge-warning">Menunggu Verifikasi</span></p>`
            : `<p class="payment-status-note">Status: <span class="badge badge-success">Terverifikasi</span></p>`
        }
      </div>
    </div>
    `
        : ""
    }

    ${
      order.notes
        ? `
    <div class="modal-section">
      <div class="section-title">
        <span class="material-icons">note</span>
        Catatan
      </div>
      <div class="section-content">
        <div class="notes-box">${order.notes}</div>
      </div>
    </div>
    `
        : ""
    }

    ${
      driver
        ? `
    <div class="modal-section">
      <div class="section-title">
        <span class="material-icons">local_shipping</span>
        Informasi Driver
      </div>
      <div class="section-content">
        <div class="info-row">
          <span class="label">Nama Driver:</span>
          <span class="value">${driver.name}</span>
        </div>
        <div class="info-row">
          <span class="label">Telepon:</span>
          <span class="value">${driver.phone}</span>
        </div>
      </div>
    </div>
    `
        : ""
    }

    ${
      order.status === "pending" &&
      !order.payment_verified &&
      order.payment_method === "qris"
        ? `
    <div class="modal-actions">
      <button class="btn btn-success btn-block" onclick="verifyPayment(${order.id})">
        <span class="material-icons">check_circle</span>
        Verifikasi Pembayaran
      </button>
      <button class="btn btn-danger btn-block" onclick="rejectPayment(${order.id})">
        <span class="material-icons">cancel</span>
        Tolak Pembayaran
      </button>
    </div>
    `
        : order.status === "pending"
        ? `
    <div class="modal-actions">
      <button class="btn btn-success btn-block" onclick="openAssignModal(${order.id}); document.getElementById('orderModal').style.display='none';">
        <span class="material-icons">check_circle</span>
        Setujui Pesanan
      </button>
      <button class="btn btn-danger btn-block" onclick="openRejectModal(${order.id}); document.getElementById('orderModal').style.display='none';">
        <span class="material-icons">cancel</span>
        Tolak Pesanan
      </button>
    </div>
    `
        : ""
    }
  `;

  document.getElementById("orderDetailContent").innerHTML = detailHtml;
  document.getElementById("orderModal").style.display = "block";
}

function openAssignModal(orderId) {
  currentOrderId = orderId;
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  const orderDomicile = order.domicile || "Tidak Ditentukan";

  // Filter drivers by session
  const sessionMatchedDrivers = allDrivers.filter(
    (d) =>
      d.driver_session === order.pickup_session || d.driver_session === "both"
  );

  // Separate drivers by domicile match
  const matchingDomicileDrivers = sessionMatchedDrivers.filter(
    (d) => d.wilayah === orderDomicile
  );
  const otherDomicileDrivers = sessionMatchedDrivers.filter(
    (d) => d.wilayah !== orderDomicile
  );

  document.getElementById("assignOrderInfo").innerHTML = `
    <strong>Pesanan #${order.id}</strong><br>
    <span class="domicile-info"><span class="material-icons" style="font-size: 14px; vertical-align: middle;">location_on</span> Domisili: <strong>${orderDomicile}</strong></span>
  `;

  const driverSelect = document.getElementById("driverSelect");
  const otherDriverContainer = document.getElementById("otherDriverContainer");
  const otherDriverCheckbox = document.getElementById("showOtherDrivers");
  const otherDriverWarning = document.getElementById("otherDriverWarning");

  // Reset checkbox and warning
  if (otherDriverCheckbox) {
    otherDriverCheckbox.checked = false;
  }
  if (otherDriverWarning) {
    otherDriverWarning.style.display = "none";
  }

  // Build driver select options
  let optionsHtml = '<option value="">-- Pilih Driver --</option>';

  if (matchingDomicileDrivers.length > 0) {
    optionsHtml += `<optgroup label="Driver Wilayah ${orderDomicile}">`;
    matchingDomicileDrivers.forEach((d) => {
      optionsHtml += `<option value="${d.id}" data-domicile="match">${
        d.name
      } - ${getSessionLabel(d.driver_session)}</option>`;
    });
    optionsHtml += "</optgroup>";
  }

  if (
    matchingDomicileDrivers.length === 0 &&
    otherDomicileDrivers.length === 0
  ) {
    driverSelect.innerHTML =
      '<option value="">Tidak ada driver tersedia untuk sesi ini</option>';
    document.getElementById("confirmAssignBtn").disabled = true;
  } else if (matchingDomicileDrivers.length === 0) {
    driverSelect.innerHTML =
      '<option value="">Tidak ada driver di wilayah ini</option>';
    document.getElementById("confirmAssignBtn").disabled = true;
  } else {
    driverSelect.innerHTML = optionsHtml;
    document.getElementById("confirmAssignBtn").disabled = false;
  }

  // Show/hide other driver section
  if (otherDriverContainer) {
    if (otherDomicileDrivers.length > 0) {
      otherDriverContainer.style.display = "block";
      otherDriverContainer.dataset.drivers =
        JSON.stringify(otherDomicileDrivers);
      otherDriverContainer.dataset.orderDomicile = orderDomicile;
    } else {
      otherDriverContainer.style.display = "none";
    }
  }

  document.getElementById("assignModal").style.display = "block";
}

function toggleOtherDrivers() {
  const checkbox = document.getElementById("showOtherDrivers");
  const warning = document.getElementById("otherDriverWarning");
  const driverSelect = document.getElementById("driverSelect");
  const container = document.getElementById("otherDriverContainer");
  const order = allOrders.find((o) => o.id === currentOrderId);
  const orderDomicile = order?.domicile || "Tidak Ditentukan";

  if (checkbox.checked) {
    warning.style.display = "block";

    // Add other drivers to select
    const otherDrivers = JSON.parse(container.dataset.drivers || "[]");

    if (otherDrivers.length > 0) {
      let currentOptions = driverSelect.innerHTML;
      currentOptions += `<optgroup label="Driver Wilayah Lain (⚠️)">`;
      otherDrivers.forEach((d) => {
        currentOptions += `<option value="${
          d.id
        }" data-domicile="other" class="other-domicile-option">${d.name} - ${
          d.wilayah
        } - ${getSessionLabel(d.driver_session)}</option>`;
      });
      currentOptions += "</optgroup>";
      driverSelect.innerHTML = currentOptions;
    }

    document.getElementById("confirmAssignBtn").disabled = false;
  } else {
    warning.style.display = "none";

    // Remove other drivers from select
    const matchingDrivers = allDrivers.filter(
      (d) =>
        (d.driver_session === order.pickup_session ||
          d.driver_session === "both") &&
        d.wilayah === orderDomicile
    );

    let optionsHtml = '<option value="">-- Pilih Driver --</option>';
    if (matchingDrivers.length > 0) {
      optionsHtml += `<optgroup label="Driver Wilayah ${orderDomicile}">`;
      matchingDrivers.forEach((d) => {
        optionsHtml += `<option value="${d.id}" data-domicile="match">${
          d.name
        } - ${getSessionLabel(d.driver_session)}</option>`;
      });
      optionsHtml += "</optgroup>";
      driverSelect.innerHTML = optionsHtml;
      document.getElementById("confirmAssignBtn").disabled = false;
    } else {
      driverSelect.innerHTML =
        '<option value="">Tidak ada driver di wilayah ini</option>';
      document.getElementById("confirmAssignBtn").disabled = true;
    }

    // Reset selection
    driverSelect.value = "";
  }
}

function openRejectModal(orderId) {
  currentOrderId = orderId;
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  document.getElementById("rejectOrderInfo").textContent = `Pesanan #${
    order.id
  } - ${order.customer_name || "N/A"}`;

  document.getElementById("rejectModal").style.display = "block";
}

async function confirmAssignDriver() {
  const driverId = document.getElementById("driverSelect").value;

  if (!driverId) {
    alert("Silakan pilih driver terlebih dahulu");
    return;
  }

  try {
    await adminAPI.assignDriver(currentOrderId, driverId);
    alert("Driver berhasil ditetapkan!");
    closeAllModals();
    await loadOrders();
  } catch (error) {
    console.error("Error assigning driver:", error);
    alert("Gagal menetapkan driver: " + error.message);
  }
}

async function confirmRejectOrder() {
  try {
    await adminAPI.cancelOrder(currentOrderId);
    alert("Pesanan berhasil ditolak!");
    closeAllModals();
    await loadOrders();
  } catch (error) {
    console.error("Error rejecting order:", error);
    alert("Gagal menolak pesanan: " + error.message);
  }
}

function closeAllModals() {
  document.getElementById("orderModal").style.display = "none";
  document.getElementById("assignModal").style.display = "none";
  document.getElementById("rejectModal").style.display = "none";
  currentOrderId = null;
}

// Helper functions
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

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Payment verification functions
async function verifyPayment(orderId) {
  if (!confirm("Apakah Anda yakin ingin memverifikasi pembayaran ini?")) return;

  try {
    await adminAPI.verifyPayment(orderId);
    alert("Pembayaran berhasil diverifikasi!");
    closeAllModals();
    await loadOrders();
  } catch (error) {
    console.error("Error verifying payment:", error);
    alert("Gagal memverifikasi pembayaran: " + error.message);
  }
}

async function rejectPayment(orderId) {
  if (
    !confirm(
      "Apakah Anda yakin ingin menolak pembayaran ini? Pesanan akan dibatalkan dan customer perlu membuat pesanan baru."
    )
  )
    return;

  try {
    await adminAPI.rejectPayment(orderId);
    alert("Pembayaran ditolak dan pesanan dibatalkan!");
    closeAllModals();
    await loadOrders();
  } catch (error) {
    console.error("Error rejecting payment:", error);
    alert("Gagal menolak pembayaran: " + error.message);
  }
}

function openPaymentProofModal(imageSrc) {
  // Create modal for viewing payment proof
  let modal = document.getElementById("paymentProofModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "paymentProofModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; padding: 20px;">
        <span class="close" onclick="closePaymentProofModal()">&times;</span>
        <h3>Bukti Pembayaran</h3>
        <img id="paymentProofFullImg" src="" alt="Bukti Pembayaran" style="width: 100%; border-radius: 8px; margin-top: 15px;" />
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("paymentProofFullImg").src = imageSrc;
  modal.style.display = "block";
}

function closePaymentProofModal() {
  const modal = document.getElementById("paymentProofModal");
  if (modal) modal.style.display = "none";
}
