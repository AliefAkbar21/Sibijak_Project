// Signup form handler
document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (isLoggedIn()) {
    const user = getCurrentUser();
    redirectToDashboard(user.role);
    return;
  }

  const form = document.getElementById("signupForm");
  const roleSelect = document.getElementById("role");
  const driverFields = document.getElementById("driverFields");
  const errorMessage = document.getElementById("errorMessage");
  const togglePassword = document.getElementById("togglePasswordSignup");
  const passwordInput = document.getElementById("password");

  // Password toggle functionality
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent =
        type === "password" ? "visibility_off" : "visibility";
    });
  }

  // Check URL params for role
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get("role");
  if (roleParam) {
    roleSelect.value = roleParam;
    toggleDriverFields();
  }

  // Toggle driver specific fields
  roleSelect.addEventListener("change", toggleDriverFields);

  function toggleDriverFields() {
    if (roleSelect.value === "driver") {
      driverFields.style.display = "block";
    } else {
      driverFields.style.display = "none";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMessage.style.display = "none";

    const formData = new FormData(form);
    const userData = {
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      role: formData.get("role"),
      phone: formData.get("phone"),
      address: formData.get("address"),
    };

    // Add driver specific fields
    if (userData.role === "driver") {
      userData.session_preference = formData.get("session_preference");
      userData.vehicle_number = formData.get("vehicle_number");
      userData.wilayah = formData.get("wilayah");
    }

    try {
      const response = await authAPI.signup(userData);

      // Show message for drivers that they need verification
      if (userData.role === "driver") {
        alert(
          "Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi dari admin. Silakan login setelah akun Anda diverifikasi."
        );
        window.location.href = "login.html";
        return;
      }

      // Auto login after signup (for customers only)
      const loginResponse = await authAPI.login(
        userData.email,
        userData.password
      );
      saveAuth(loginResponse.access_token, loginResponse.user);

      // Redirect to appropriate dashboard
      redirectToDashboard(loginResponse.user.role);
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = "block";
    }
  });
});
