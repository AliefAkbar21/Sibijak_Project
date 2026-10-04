// Driver profile
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["driver"])) return;

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  try {
    const user = await authAPI.getCurrentUser();
    displayProfile(user);
    document.getElementById("userName").textContent = user.name.split(" ")[0];
  } catch (error) {
    console.error("Error loading profile:", error);
    document.getElementById("profileInfo").innerHTML = `
      <div class="empty-state">
        <span class="material-icons">error_outline</span>
        <p>Gagal memuat data profil: ${error.message}</p>
      </div>
    `;
  }
});

function displayProfile(user) {
  // Update profile info grid with inline styles - Generate full profile page
  const container = document.getElementById("profileInfo");
  container.innerHTML = `
    <!-- Header Card Hijau dengan Avatar -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 32px 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
      <div style="display: flex; align-items: center; gap: 20px;">
        <div style="width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255, 255, 255, 0.4);">
          <span class="material-icons" style="font-size: 36px; color: white;">person</span>
        </div>
        <div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: white;">${
            user.name
          }</h2>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-top: 4px;">driver</div>
        </div>
      </div>
    </div>

    <!-- Info Card Putih -->
    <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <span class="material-icons" style="color: #10b981; font-size: 24px;">info</span>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">Informasi Akun</h3>
      </div>
      
      <!-- Grid Info Items -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
        <!-- Nama -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #0284c7;">person</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Nama</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500; word-break: break-word;">${
              user.name
            }</div>
          </div>
        </div>

        <!-- Email -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #d97706;">email</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Email</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500; word-break: break-word;">${
              user.email
            }</div>
          </div>
        </div>

        <!-- Telepon -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #2563eb;">phone</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Telepon</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500;">${
              user.phone || "-"
            }</div>
          </div>
        </div>

        <!-- Alamat -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #fce7f3; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #db2777;">location_on</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Alamat</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500; word-break: break-word;">${
              user.address || "Peningilan"
            }</div>
          </div>
        </div>

        <!-- Sesi Pilihan -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #6366f1;">schedule</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Sesi Pilihan</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500;">${getSessionText(
              user.session_preference
            )}</div>
          </div>
        </div>

        <!-- Wilayah Penugasan -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #d97706;">map</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Wilayah Penugasan</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500;">${
              user.wilayah || "-"
            }</div>
          </div>
        </div>

        <!-- Nomor Kendaraan -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #ddd6fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #7c3aed;">credit_card</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Nomor Kendaraan</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500;">${
              user.vehicle_number || "B 7777 VQN"
            }</div>
          </div>
        </div>

        <!-- Status -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: ${
          user.is_verified ? "#f0fdf4" : "#fef3c7"
        }; border-radius: 8px; border: 1px solid ${
    user.is_verified ? "#bbf7d0" : "#fde68a"
  };">
          <div style="width: 40px; height: 40px; background: ${
            user.is_verified ? "#dcfce7" : "#fef3c7"
          }; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: ${
              user.is_verified ? "#16a34a" : "#d97706"
            };">${user.is_verified ? "check_circle" : "pending"}</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Status</div>
            <div style="font-size: 15px; color: ${
              user.is_verified ? "#16a34a" : "#d97706"
            }; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              ${user.is_verified ? "Aktif" : "Menunggu Verifikasi"}
              <span style="width: 8px; height: 8px; background: ${
                user.is_verified ? "#16a34a" : "#d97706"
              }; border-radius: 50%; display: inline-block;"></span>
            </div>
          </div>
        </div>

        <!-- Terdaftar -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="width: 40px; height: 40px; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span class="material-icons" style="font-size: 20px; color: #4f46e5;">calendar_today</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Terdaftar</div>
            <div style="font-size: 15px; color: #1f2937; font-weight: 500;">${formatDate(
              user.created_at
            )}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getSessionText(session) {
  const texts = {
    morning: "Pagi",
    afternoon: "Sore",
    both: "Pagi & Sore",
  };
  return texts[session] || "-";
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
