// Customer profile
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["customer"])) return;

  try {
    const user = await authAPI.getCurrentUser();
    const { orders } = await customerAPI.getOrders();

    displayProfile(user, orders);
    setupFormHandlers(user);
    setupAvatarUpload();
  } catch (error) {
    console.error("Error loading profile:", error);
  }
});

function displayProfile(user, orders) {
  // Update top button
  document.getElementById("topUserName").textContent = user.name.split(" ")[0];

  // Update profile header
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;

  // Display profile photo if exists
  if (user.profile_picture) {
    const profileImg = document.getElementById("profileImage");
    const profileIcon = document.getElementById("profileIcon");
    profileImg.src = user.profile_picture;
    profileImg.style.display = "block";
    profileIcon.style.display = "none";
  }

  if (user.is_verified) {
    document.getElementById("verifiedBadge").style.display = "inline-flex";
  }

  // Calculate stats
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalWeight = completedOrders.reduce((sum, o) => sum + o.weight, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // Update stats
  document.getElementById("profileTotalOrders").textContent = totalOrders;
  document.getElementById("profileTotalWeight").textContent =
    totalWeight.toFixed(1) + " kg";
  document.getElementById("profilePendingOrders").textContent = pendingOrders;

  // Populate form
  document.getElementById("inputName").value = user.name || "";
  document.getElementById("inputEmail").value = user.email || "";
  document.getElementById("inputPhone").value = user.phone || "";
  document.getElementById("inputCity").value = user.city || "";
  document.getElementById("inputAddress").value = user.address || "";
  document.getElementById("inputPostalCode").value = user.postal_code || "";

  // Display activity timeline
  displayTimeline(orders);
}

function displayTimeline(orders) {
  const container = document.getElementById("activityTimeline");

  if (orders.length === 0) {
    container.innerHTML = '<p class="text-muted">Belum ada aktivitas</p>';
    return;
  }

  const recentOrders = orders.slice(0, 6);
  const colors = {
    pending: "#F9A825",
    assigned: "#2196F3",
    in_progress: "#9C27B0",
    completed: "#2C6E49",
    cancelled: "#F44336",
  };

  const labels = {
    pending: "Pesanan ORD-{id} dibuat",
    assigned: "Pesanan ORD-{id} diterima driver",
    in_progress: "Pesanan ORD-{id} sedang diproses",
    completed: "Pesanan ORD-{id} selesai",
    cancelled: "Pesanan ORD-{id} dibatalkan",
  };

  container.innerHTML = recentOrders
    .map((order) => {
      const timeAgo = getTimeAgo(order.created_at);
      const label = labels[order.status].replace(
        "{id}",
        String(order.id).padStart(3, "0")
      );

      return `
      <div class="timeline-item">
        <div class="timeline-dot" style="background-color: ${
          colors[order.status]
        };"></div>
        <div class="timeline-content">
          <h4>${label}</h4>
          <p>${timeAgo}</p>
        </div>
      </div>
    `;
    })
    .join("");
}

function getTimeAgo(dateStr) {
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
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function setupFormHandlers(user) {
  const form = document.getElementById("profileForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const profileData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      postal_code: formData.get("postal_code"),
    };

    try {
      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";

      const response = await customerAPI.updateProfile(profileData);

      // Update displayed name with the data we just sent
      document.getElementById("profileName").textContent = profileData.name;
      document.getElementById("topUserName").textContent =
        profileData.name.split(" ")[0];

      // Update user object
      user.name = profileData.name;
      user.phone = profileData.phone;
      user.address = profileData.address;
      user.city = profileData.city;
      user.postal_code = profileData.postal_code;

      alert("Profil berhasil diupdate!");
    } catch (error) {
      console.error("Update profile error:", error);
      alert("Gagal mengupdate profil: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Simpan Perubahan";
    }
  });

  cancelBtn.addEventListener("click", () => {
    // Reset form to original values
    document.getElementById("inputName").value = user.name || "";
    document.getElementById("inputPhone").value = user.phone || "";
    document.getElementById("inputCity").value = user.city || "";
    document.getElementById("inputAddress").value = user.address || "";
    document.getElementById("inputPostalCode").value = user.postal_code || "";
  });
}

function setupAvatarUpload() {
  const editBtn = document.getElementById("editAvatarBtn");
  const fileInput = document.getElementById("avatarInput");
  const profileImg = document.getElementById("profileImage");
  const profileIcon = document.getElementById("profileIcon");

  editBtn.addEventListener("click", (e) => {
    e.preventDefault();
    fileInput.click();
  });

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    try {
      // Show loading state
      editBtn.disabled = true;
      editBtn.querySelector(".material-icons").textContent = "hourglass_empty";

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result;

        try {
          // Upload to server
          await customerAPI.updateProfilePicture(base64Image);

          // Update UI
          profileImg.src = base64Image;
          profileImg.style.display = "block";
          profileIcon.style.display = "none";

          alert("Foto profil berhasil diupdate!");
        } catch (error) {
          alert("Gagal mengupload foto: " + error.message);
        } finally {
          editBtn.disabled = false;
          editBtn.querySelector(".material-icons").textContent = "edit";
        }
      };

      reader.onerror = () => {
        alert("Gagal membaca file");
        editBtn.disabled = false;
        editBtn.querySelector(".material-icons").textContent = "edit";
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Terjadi kesalahan: " + error.message);
      editBtn.disabled = false;
      editBtn.querySelector(".material-icons").textContent = "edit";
    }
  });
}
