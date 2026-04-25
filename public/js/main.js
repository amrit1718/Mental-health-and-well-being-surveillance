const App = (() => {
  const apiBase = "/api";

  function getToken() {
    return localStorage.getItem("token");
  }

  function getUser() {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  }

  function setSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  function showMessage(element, message, type = "") {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = "message-box";
    if (type) {
      element.classList.add(type);
    }
  }

  function showInline(element, message, type = "") {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = "inline-note";
    if (type) {
      element.classList.add(type);
    }
  }

  async function apiRequest(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
      body: options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  function requireAuth(messageElement, redirect = true) {
    if (getToken()) {
      return true;
    }

    if (messageElement) {
      showInline(messageElement, "Please log in first to access child profiles and assessments.", "error");
    }

    if (redirect) {
      setTimeout(() => {
        window.location.href = "auth.html";
      }, 1600);
    }

    return false;
  }

  function updateNavigationState() {
    const currentPage = document.body.dataset.page;
    const navLinks = document.querySelectorAll(".nav-links a");
    const authLink = document.querySelector(".auth-link");
    const user = getUser();

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        (currentPage === "home" && href === "index.html") ||
        href === `${currentPage}.html`
      ) {
        link.classList.add("active");
      }
    });

    if (authLink && user) {
      authLink.textContent = `Hi, ${user.name.split(" ")[0]}`;
      authLink.href = "dashboard.html";
    }
  }

  function setupMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (!menuToggle || !navLinks) {
      return;
    }

    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  function setupContactForm() {
    const contactForm = document.getElementById("contactForm");
    const contactMessage = document.getElementById("contactMessage");

    if (!contactForm) {
      return;
    }

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showMessage(contactMessage, "Message received. This prototype simulates contact handling on the frontend.", "success");
      contactForm.reset();
    });
  }

  function setupLogoutButton() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener("click", () => {
      clearSession();
      window.location.href = "auth.html";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupMenu();
    setupContactForm();
    setupLogoutButton();
    updateNavigationState();

    const year = document.getElementById("year");
    if (year) {
      year.textContent = new Date().getFullYear();
    }
  });

  return {
    apiRequest,
    getToken,
    getUser,
    setSession,
    clearSession,
    showMessage,
    showInline,
    requireAuth
  };
})();

window.App = App;
