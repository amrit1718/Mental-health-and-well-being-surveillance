document.addEventListener("DOMContentLoaded", () => {
  const authMessage = document.getElementById("authMessage");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabButtons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");

  function switchTab(tabName) {
    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tabName);
    });

    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `${tabName}Form`);
    });

    App.showMessage(authMessage, "");
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  if (App.getToken()) {
    App.showMessage(authMessage, "You are already logged in. Redirecting to the dashboard...", "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const payload = {
      email: String(formData.get("email")).trim(),
      password: String(formData.get("password")).trim()
    };

    if (!payload.email || !payload.password) {
      App.showMessage(authMessage, "Please enter both email and password.", "error");
      return;
    }

    try {
      App.showMessage(authMessage, "Logging in...");
      const response = await App.apiRequest("/auth/login", {
        method: "POST",
        body: payload
      });
      App.setSession(response);
      App.showMessage(authMessage, "Login successful. Redirecting to dashboard...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      App.showMessage(authMessage, error.message, "error");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const payload = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      role: String(formData.get("role")).trim(),
      password: String(formData.get("password")).trim(),
      confirmPassword: String(formData.get("confirmPassword")).trim()
    };

    if (!payload.name || !payload.email || !payload.password) {
      App.showMessage(authMessage, "Please fill in all required registration fields.", "error");
      return;
    }

    if (payload.password.length < 6) {
      App.showMessage(authMessage, "Password must be at least 6 characters long.", "error");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      App.showMessage(authMessage, "Password and confirm password do not match.", "error");
      return;
    }

    try {
      App.showMessage(authMessage, "Creating account...");
      const response = await App.apiRequest("/auth/register", {
        method: "POST",
        body: payload
      });
      App.setSession(response);
      App.showMessage(authMessage, "Registration successful. Redirecting to dashboard...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (error) {
      App.showMessage(authMessage, error.message, "error");
    }
  });
});
