// Customer order creation
let map, marker;

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["customer"])) return;

  const user = getCurrentUser();
  const userNameBtn = document.getElementById("userName");
  if (userNameBtn) {
    userNameBtn.textContent = user.name.split(" ")[0];
  }

  initMap();
  setupFormHandlers();
  setMinDate();
});

function initMap() {
  // Initialize Leaflet map centered on Jakarta
  map = L.map("map").setView([-6.2088, 106.8456], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Click event to set marker
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;
  });
}

function setupFormHandlers() {
  const form = document.getElementById("orderForm");
  const weightInput = document.getElementById("weight");

  // Calculate price on weight change
  weightInput.addEventListener("input", debounce(calculatePrice, 500));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const paymentMethod = formData.get("payment_method") || "cash";

    const orderData = {
      name: formData.get("name"),
      address: formData.get("address"),
      domicile: formData.get("domicile"),
      latitude: parseFloat(formData.get("latitude")) || null,
      longitude: parseFloat(formData.get("longitude")) || null,
      waste_type: formData.get("waste_type"),
      weight: parseFloat(formData.get("weight")),
      pickup_session: formData.get("pickup_session"),
      pickup_date: formData.get("pickup_date"),
      notes: formData.get("notes"),
      payment_method: paymentMethod,
    };

    // If QRIS payment, show modal instead of submitting directly
    if (paymentMethod === "qris") {
      window.pendingOrderData = orderData;
      showQrisModal();
      return;
    }

    // For cash payment, submit directly
    try {
      const response = await customerAPI.createOrder(orderData);
      alert("Pesanan berhasil dibuat!");
      window.location.href = "orders.html";
    } catch (error) {
      alert("Gagal membuat pesanan: " + error.message);
    }
  });

  setupQrisModal();
}

async function calculatePrice() {
  const weight = parseFloat(document.getElementById("weight").value);

  if (!weight || weight <= 0) {
    document.getElementById("priceCalc").style.display = "none";
    return;
  }

  try {
    const data = await customerAPI.calculatePrice(weight);

    document.getElementById("basePrice").textContent =
      "Rp " + formatNumber(data.base_price);
    document.getElementById("adminFee").textContent =
      "Rp " + formatNumber(data.admin_fee);

    if (data.additional_fee > 0) {
      document.getElementById("additionalFeeRow").style.display = "flex";
      document.getElementById("additionalFee").textContent =
        "Rp " + formatNumber(data.additional_fee);
    } else {
      document.getElementById("additionalFeeRow").style.display = "none";
    }

    document.getElementById("totalPrice").textContent =
      "Rp " + formatNumber(data.total_price);
    document.getElementById("priceCalc").style.display = "block";
  } catch (error) {
    console.error("Error calculating price:", error);
  }
}

function setMinDate() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = tomorrow.toISOString().split("T")[0];
  document.getElementById("pickupDate").min = dateStr;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatNumber(num) {
  return new Intl.NumberFormat("id-ID").format(num);
}

function setupQrisModal() {
  const modal = document.getElementById("qrisModal");
  const cancelBtn = document.getElementById("qrisCancel");
  const submitBtn = document.getElementById("qrisSubmit");
  const fileInput = document.getElementById("paymentProof");
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  // File input change handler
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      fileNameDisplay.textContent = e.target.files[0].name;
    } else {
      fileNameDisplay.textContent = "Tambahkan catatan jika diperlukan";
    }
  });

  // Cancel button
  cancelBtn.addEventListener("click", () => {
    hideQrisModal();
  });

  // Submit button
  submitBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Silakan upload bukti pembayaran terlebih dahulu");
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const orderData = window.pendingOrderData;
      orderData.payment_proof = e.target.result;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Mengirim...";
        const response = await customerAPI.createOrder(orderData);
        hideQrisModal();
        alert("Pesanan berhasil dibuat!");
        window.location.href = "orders.html";
      } catch (error) {
        alert("Gagal membuat pesanan: " + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim";
      }
    };
    reader.readAsDataURL(file);
  });

  // Close modal on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideQrisModal();
    }
  });
}

function showQrisModal() {
  const modal = document.getElementById("qrisModal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function hideQrisModal() {
  const modal = document.getElementById("qrisModal");
  const fileInput = document.getElementById("paymentProof");
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  modal.style.display = "none";
  document.body.style.overflow = "auto";
  fileInput.value = "";
  fileNameDisplay.textContent = "Tambahkan catatan jika diperlukan";
  window.pendingOrderData = null;
}
