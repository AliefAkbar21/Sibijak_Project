// Admin Drivers Verification Page
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["admin"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // Setup filter tabs
  setupFilterTabs();

  // Setup modal
  setupModal();

  // Load drivers (default: pending)
  await loadDrivers("pending");
});

let currentFilter = "pending";

function setupFilterTabs() {
  const tabs = document.querySelectorAll(".filter-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      await loadDrivers(currentFilter);
    });
  });
}

function setupModal() {
  const modal = document.getElementById("driverDetailModal");
  const closeBtn = document.getElementById("closeModal");

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

async function loadDrivers(filter) {
  const container = document.getElementById("driversList");
  container.innerHTML = `
    <div class="loading-state">
      <span class="material-icons spinning">sync</span>
      <p>Memuat data driver...</p>
    </div>
  `;

  try {
    let drivers;
    if (filter === "pending") {
      drivers = await adminAPI.getDrivers("false");
    } else if (filter === "verified") {
      drivers = await adminAPI.getDrivers("true");
    } else {
      drivers = await adminAPI.getDrivers();
    }

    displayDrivers(drivers, filter);
  } catch (error) {
    console.error("Error loading drivers:", error);
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error_outline</span>
        <p>Gagal memuat data driver: ${error.message}</p>
      </div>
    `;
  }
}

function displayDrivers(drivers, filter) {
  const container = document.getElementById("driversList");

  if (!drivers || drivers.length === 0) {
    const message =
      filter === "pending"
        ? "Tidak ada driver yang menunggu verifikasi"
        : filter === "verified"
        ? "Belum ada driver terverifikasi"
        : "Belum ada driver terdaftar";

    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">person_off</span>
        <p>${message}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = drivers
    .map(
      (driver) => `
      <div class="driver-verification-card" onclick="showDriverDetail(${
        driver.id
      })">
        <div class="driver-card-left">
          <div class="driver-avatar-medium">
            ${
              driver.profile_picture
                ? `<img src="${driver.profile_picture}" alt="${driver.name}">`
                : `<span class="material-icons">person</span>`
            }
          </div>
          <div class="driver-card-info">
            <h4 class="driver-card-name">${driver.name}</h4>
            <div class="driver-card-meta">
              <span><span class="material-icons">location_on</span>${
                driver.wilayah || "Belum diatur"
              }</span>
              <span><span class="material-icons">local_shipping</span>${
                driver.vehicle_number || "Belum ada"
              }</span>
            </div>
            <div class="driver-card-meta">
              <span><span class="material-icons">phone</span>${
                driver.phone || "-"
              }</span>
              <span><span class="material-icons">schedule</span>${getSessionLabel(
                driver.session_preference
              )}</span>
            </div>
          </div>
        </div>
        <div class="driver-card-right">
          <span class="badge ${
            driver.is_verified ? "badge-success" : "badge-warning"
          }">
            ${driver.is_verified ? "Terverifikasi" : "Menunggu Verifikasi"}
          </span>
          <span class="driver-date">
            <span class="material-icons">calendar_today</span>
            ${formatDate(driver.created_at)}
          </span>
          <span class="material-icons chevron">chevron_right</span>
        </div>
      </div>
    `
    )
    .join("");
}

async function showDriverDetail(driverId) {
  const modal = document.getElementById("driverDetailModal");
  const content = document.getElementById("driverDetailContent");
  const footer = document.getElementById("driverModalFooter");

  try {
    const drivers = await adminAPI.getDrivers();
    const driver = drivers.find((d) => d.id === driverId);

    if (!driver) {
      alert("Driver tidak ditemukan");
      return;
    }

    content.innerHTML = `
      <div class="driver-detail-header">
        <div class="driver-avatar-large">
          ${
            driver.profile_picture
              ? `<img src="${driver.profile_picture}" alt="${driver.name}">`
              : `<span class="material-icons">person</span>`
          }
        </div>
        <div class="driver-detail-title">
          <h3>${driver.name}</h3>
          <span class="badge ${
            driver.is_verified ? "badge-success" : "badge-warning"
          }">
            ${driver.is_verified ? "Terverifikasi" : "Menunggu Verifikasi"}
          </span>
        </div>
      </div>
      
      <div class="driver-detail-grid">
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">email</span>Email
          </span>
          <span class="detail-value">${driver.email}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">phone</span>Telepon
          </span>
          <span class="detail-value">${driver.phone || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">home</span>Alamat
          </span>
          <span class="detail-value">${driver.address || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">location_on</span>Wilayah Penugasan
          </span>
          <span class="detail-value">${driver.wilayah || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">schedule</span>Sesi Pilihan
          </span>
          <span class="detail-value">${getSessionLabel(
            driver.session_preference
          )}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">local_shipping</span>Nomor Kendaraan
          </span>
          <span class="detail-value">${driver.vehicle_number || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <span class="material-icons">calendar_today</span>Tanggal Daftar
          </span>
          <span class="detail-value">${formatDate(driver.created_at)}</span>
        </div>
      </div>
    `;

    if (!driver.is_verified) {
      footer.innerHTML = `
        <button class="btn-danger" onclick="rejectDriver(${driver.id})">
          <span class="material-icons">close</span>Tolak
        </button>
        <button class="btn-success" onclick="verifyDriver(${driver.id})">
          <span class="material-icons">check</span>Verifikasi
        </button>
      `;
    } else {
      footer.innerHTML = `
        <button class="btn-secondary" onclick="closeModal()">Tutup</button>
      `;
    }

    modal.style.display = "block";
  } catch (error) {
    console.error("Error loading driver detail:", error);
    alert("Gagal memuat detail driver: " + error.message);
  }
}

async function verifyDriver(driverId) {
  if (!confirm("Apakah Anda yakin ingin memverifikasi driver ini?")) return;

  try {
    await adminAPI.verifyDriver(driverId);
    alert("Driver berhasil diverifikasi!");
    document.getElementById("driverDetailModal").style.display = "none";
    await loadDrivers(currentFilter);
  } catch (error) {
    console.error("Error verifying driver:", error);
    alert("Gagal memverifikasi driver: " + error.message);
  }
}

async function rejectDriver(driverId) {
  if (
    !confirm(
      "Apakah Anda yakin ingin menolak driver ini? Akun akan dihapus secara permanen."
    )
  )
    return;

  try {
    await adminAPI.rejectDriver(driverId);
    alert("Driver ditolak dan akun dihapus.");
    document.getElementById("driverDetailModal").style.display = "none";
    await loadDrivers(currentFilter);
  } catch (error) {
    console.error("Error rejecting driver:", error);
    alert("Gagal menolak driver: " + error.message);
  }
}

function closeModal() {
  document.getElementById("driverDetailModal").style.display = "none";
}

function getSessionLabel(session) {
  switch (session) {
    case "morning":
      return "Pagi";
    case "afternoon":
      return "Sore";
    case "both":
      return "Pagi & Sore";
    default:
      return "Belum diatur";
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
