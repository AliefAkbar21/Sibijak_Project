// Customer dashboard
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth(["customer"])) return;

  const user = getCurrentUser();
  document.getElementById("userName").textContent = user.name;

  try {
    // Load orders
    const { orders } = await customerAPI.getOrders();

    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const completedOrders = orders.filter(
      (o) => o.status === "completed"
    ).length;
    const totalWeight = orders.reduce((sum, o) => sum + o.weight, 0);

    // Update stats
    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("pendingOrders").textContent = pendingOrders;
    document.getElementById("completedOrders").textContent = completedOrders;
    document.getElementById("totalWeight").textContent =
      totalWeight.toFixed(1) + " kg";

    // Display recent orders or empty state
    if (orders.length === 0) {
      document.querySelector(".data-table").style.display = "none";
      document.getElementById("emptyState").style.display = "block";
    } else {
      displayRecentOrders(orders.slice(0, 5));
    }
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
});

function displayRecentOrders(orders) {
  const tbody = document.getElementById("recentOrders");

  if (orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center">Belum ada pesanan</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map(
      (order) => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.address.substring(0, 30)}...</td>
            <td>${getWasteTypeLabel(order.waste_type)}</td>
            <td>${order.weight} kg</td>
            <td>Rp ${formatNumber(order.total_price)}</td>
            <td><span class="badge badge-${getStatusClass(
              order.status
            )}">${getStatusLabel(order.status)}</span></td>
            <td>${formatDate(order.created_at)}</td>
        </tr>
    `
    )
    .join("");
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

function formatNumber(num) {
  return new Intl.NumberFormat("id-ID").format(num);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID");
}
