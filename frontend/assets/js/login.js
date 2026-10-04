// Login form handler
document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (isLoggedIn()) {
    const user = getCurrentUser();
    redirectToDashboard(user.role);
    return;
  }

  const form = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const togglePassword = document.getElementById("togglePassword");
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMessage.style.display = "none";

    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await authAPI.login(email, password);

      // Save token and user data
      saveAuth(response.access_token, response.user);

      // Redirect to appropriate dashboard
      redirectToDashboard(response.user.role);
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = "block";
    }
  });
});
