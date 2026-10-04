// Admin Regional Report
// Regions for Larangan area - synced with backend
const REGIONS = [
  { id: 1, name: "Larangan, Larangan Utara" },
  { id: 2, name: "Larangan, Larangan Selatan" },
  { id: 3, name: "Larangan, Larangan Indah" },
  { id: 4, name: "Larangan, Gaga" },
  { id: 5, name: "Larangan, Cipadu" },
  { id: 6, name: "Larangan, Cipadu Jaya" },
  { id: 7, name: "Larangan, Kreo" },
  { id: 8, name: "Larangan, Kreo Selatan" },
];

const MAX_DRIVERS_PER_REGION = 100;

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["admin"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name.split(" ")[0];

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  // Setup modal close handlers
  setupModalHandlers();

  // Load regional report data
  await loadRegionalReport();
});

function setupModalHandlers() {
  const modal = document.getElementById("driverDetailModal");
  const closeBtn = document.getElementById("closeDriverModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

async function loadRegionalReport() {
  try {
    const regionalData = await adminAPI.getRegionalReport();
    displayRegions(regionalData);
  } catch (error) {
    console.error("Error loading regional report:", error);
    document.getElementById("regionsList").innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error_outline</span>
        <p>Gagal memuat data wilayah: ${error.message}</p>
      </div>
    `;
  }
}

function displayRegions(regionalData) {
  const container = document.getElementById("regionsList");

  if (!regionalData || regionalData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">location_off</span>
        <p>Belum ada data wilayah</p>
      </div>
    `;
    return;
  }

  container.innerHTML = regionalData
    .map(
      (region) => `
      <div class="region-card" onclick="showDriverDetail('${
        region.name
      }', ${JSON.stringify(region.drivers).replace(/"/g, "&quot;")})">
        <div class="region-info">
          <div class="region-icon">
            <span class="material-icons">location_on</span>
          </div>
          <div class="region-details">
            <h4 class="region-name">${region.name}</h4>
            <p class="region-hint">Klik untuk lihat detail driver</p>
          </div>
        </div>
        <div class="region-stats">
          <span class="driver-count ${
            region.total_drivers > 0 ? "available" : "unavailable"
          }">
            ${region.total_drivers}/${region.max_drivers}
          </span>
          <span class="driver-label">driver terdaftar</span>
          <span class="material-icons chevron">chevron_right</span>
        </div>
      </div>
    `
    )
    .join("");
}

function showDriverDetail(regionName, drivers) {
  const modal = document.getElementById("driverDetailModal");
  const title = document.getElementById("modalRegionTitle");
  const container = document.getElementById("driverListContainer");

  title.textContent = `Driver Wilayah ${regionName}`;

  if (!drivers || drivers.length === 0) {
    container.innerHTML = `
      <div class="empty-state-small">
        <span class="material-icons">person_off</span>
        <p>Belum ada driver di wilayah ini</p>
      </div>
    `;
  } else {
    container.innerHTML = drivers
      .map(
        (driver) => `
        <div class="driver-detail-card">
          <div class="driver-avatar">
            ${
              driver.profile_picture
                ? `<img src="${driver.profile_picture}" alt="${driver.name}">`
                : `<span class="material-icons">person</span>`
            }
          </div>
          <div class="driver-info">
            <h4 class="driver-name">${driver.name}</h4>
            <div class="driver-meta">
              <span class="driver-vehicle">
                <span class="material-icons">local_shipping</span>
                ${driver.vehicle_number || "Belum ada kendaraan"}
              </span>
              <span class="driver-session">
                <span class="material-icons">schedule</span>
                ${getSessionLabel(driver.driver_session)}
              </span>
            </div>
          </div>
          <div class="driver-status">
            <span class="badge ${
              driver.is_available ? "badge-success" : "badge-warning"
            }">
              ${driver.is_available ? "Tersedia" : "Sibuk"}
            </span>
          </div>
        </div>
      `
      )
      .join("");
  }

  modal.style.display = "block";
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
