// API Configuration
const API_BASE_URL = "http://localhost:5000/api";

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem("token");
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("API Request:", {
    endpoint,
    method: options.method || "GET",
    hasToken: !!token,
    headers,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  console.log("API Response:", {
    endpoint,
    status: response.status,
    ok: response.ok,
    data,
  });

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

// Auth API
const authAPI = {
  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (userData) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getCurrentUser: () => apiRequest("/auth/me"),
};

// Customer API
const customerAPI = {
  createOrder: (orderData) =>
    apiRequest("/customer/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  getOrders: () => apiRequest("/customer/orders"),

  getOrderDetail: (orderId) => apiRequest(`/customer/orders/${orderId}`),

  calculatePrice: (weight) =>
    apiRequest("/customer/calculate-price", {
      method: "POST",
      body: JSON.stringify({ weight }),
    }),

  updateProfilePicture: (base64Image) =>
    apiRequest("/customer/profile/picture", {
      method: "POST",
      body: JSON.stringify({ profile_picture: base64Image }),
    }),

  updateProfile: (profileData) =>
    apiRequest("/customer/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),
};

// Driver API
const driverAPI = {
  getAvailableOrders: () => apiRequest("/driver/orders"),

  getAssignedOrders: () => apiRequest("/driver/orders/assigned"),

  getOrderHistory: () => apiRequest("/driver/orders/history"),

  acceptOrder: (orderId) =>
    apiRequest(`/driver/orders/${orderId}/accept`, {
      method: "POST",
    }),

  rejectOrder: (orderId) =>
    apiRequest(`/driver/orders/${orderId}/reject`, {
      method: "POST",
    }),

  startOrder: (orderId) =>
    apiRequest(`/driver/orders/${orderId}/start`, {
      method: "POST",
    }),

  completeOrder: (orderId) =>
    apiRequest(`/driver/orders/${orderId}/complete`, {
      method: "POST",
    }),

  updateProfile: (profileData) =>
    apiRequest("/driver/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  updateProfilePicture: (base64Image) =>
    apiRequest("/driver/profile/picture", {
      method: "POST",
      body: JSON.stringify({ profile_picture: base64Image }),
    }),
};

// Admin API
const adminAPI = {
  getDashboard: () => apiRequest("/admin/dashboard"),

  getUsers: (role = null) => {
    const query = role ? `?role=${role}` : "";
    return apiRequest(`/admin/users${query}`);
  },

  getAllOrders: (status = null) => {
    const query = status ? `?status=${status}` : "";
    return apiRequest(`/admin/orders${query}`);
  },

  assignDriver: (orderId, driverId) =>
    apiRequest(`/admin/orders/${orderId}/assign`, {
      method: "POST",
      body: JSON.stringify({ driver_id: driverId }),
    }),

  cancelOrder: (orderId) =>
    apiRequest(`/admin/orders/${orderId}/cancel`, {
      method: "POST",
    }),

  verifyPayment: (orderId) =>
    apiRequest(`/admin/orders/${orderId}/verify-payment`, {
      method: "POST",
    }),

  rejectPayment: (orderId) =>
    apiRequest(`/admin/orders/${orderId}/reject-payment`, {
      method: "POST",
    }),

  getRegionalReport: () => apiRequest("/admin/regional-report"),

  getDrivers: (verified = null) => {
    const query = verified !== null ? `?verified=${verified}` : "";
    return apiRequest(`/admin/drivers${query}`);
  },

  verifyDriver: (driverId) =>
    apiRequest(`/admin/drivers/${driverId}/verify`, {
      method: "POST",
    }),

  rejectDriver: (driverId) =>
    apiRequest(`/admin/drivers/${driverId}/reject`, {
      method: "POST",
    }),
};
