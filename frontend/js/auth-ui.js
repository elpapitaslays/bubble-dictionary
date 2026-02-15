export function setupAuthUI() {
    const loginBtn = document.getElementById("login-btn");
    const guestBtn = document.getElementById("guest-btn");
    const authMenu = document.querySelector(".auth-menu");
    const userMenu = document.getElementById("user-menu");
    const usernameDisplay = document.getElementById("username-display");
    const bubbleCount = document.getElementById("bubble-count");
    const logoutBtn = document.getElementById("logout-btn");
    const loginOverlay = document.getElementById("login-overlay");
    const loginCloseBtn = document.getElementById("login-close");
    const openSignupBtn = document.getElementById("open-signup-btn");
    const signupOverlay = document.getElementById("signup-overlay");
    const signupCloseBtn = document.getElementById("signup-close");
    const openLoginFromSignupBtn = document.getElementById("open-login-from-signup-btn");
    const guestOverlay = document.getElementById("guest-overlay");
    const guestCloseBtn = document.getElementById("guest-close");
    const openLoginFromGuestBtn = document.getElementById("open-login-from-guest-btn");
    const loginEmailInput = document.getElementById("login-email");
    const signupNameInput = document.getElementById("signup-name");
    const guestUsernameInput = document.getElementById("guest-username");
    const loginSubmitBtn = document.getElementById("login-submit-btn");
    const signupSubmitBtn = document.getElementById("signup-submit-btn");
    const guestSubmitBtn = document.getElementById("guest-submit-btn");
    const passwordToggles = document.querySelectorAll(".password-toggle");

    let createdBubbleTotal = 0;

    function setBubbleCountValue(value) {
      createdBubbleTotal = Number.isFinite(value) ? Math.max(0, value) : createdBubbleTotal;
      if (bubbleCount) bubbleCount.textContent = String(createdBubbleTotal);
    }

    function openLoginPanel() {
      if (!loginOverlay) return;
      closeSignupPanel();
      closeGuestPanel();
      loginOverlay.classList.add("is-open");
      loginOverlay.setAttribute("aria-hidden", "false");
    }

    function closeLoginPanel() {
      if (!loginOverlay) return;
      loginOverlay.classList.remove("is-open");
      loginOverlay.setAttribute("aria-hidden", "true");
    }

    function openSignupPanel() {
      if (!signupOverlay) return;
      closeLoginPanel();
      closeGuestPanel();
      signupOverlay.classList.add("is-open");
      signupOverlay.setAttribute("aria-hidden", "false");
    }

    function closeSignupPanel() {
      if (!signupOverlay) return;
      signupOverlay.classList.remove("is-open");
      signupOverlay.setAttribute("aria-hidden", "true");
    }

    function openGuestPanel() {
      if (!guestOverlay) return;
      closeLoginPanel();
      closeSignupPanel();
      guestOverlay.classList.add("is-open");
      guestOverlay.setAttribute("aria-hidden", "false");
    }

    function closeGuestPanel() {
      if (!guestOverlay) return;
      guestOverlay.classList.remove("is-open");
      guestOverlay.setAttribute("aria-hidden", "true");
    }

    function setAuthenticatedUser(username) {
      if (!usernameDisplay || !authMenu || !userMenu) return;
      const safeName = username.trim();
      if (!safeName) return;

      usernameDisplay.textContent = safeName;
      setBubbleCountValue(createdBubbleTotal);
      authMenu.classList.add("is-hidden");
      userMenu.classList.add("is-visible");
      userMenu.classList.remove("is-open");
      userMenu.setAttribute("aria-hidden", "false");
      closeLoginPanel();
      closeSignupPanel();
      closeGuestPanel();
    }

    function logOutUser() {
      if (!authMenu || !userMenu || !usernameDisplay) return;
      usernameDisplay.textContent = "";
      authMenu.classList.remove("is-hidden");
      userMenu.classList.remove("is-visible", "is-open");
      userMenu.setAttribute("aria-hidden", "true");
    }

    if (loginBtn && loginOverlay) {
      loginBtn.addEventListener("click", openLoginPanel);
      loginOverlay.addEventListener("click", (event) => {
        if (event.target === loginOverlay) {
          closeLoginPanel();
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener("click", openGuestPanel);
    }

    if (loginCloseBtn) {
      loginCloseBtn.addEventListener("click", closeLoginPanel);
    }

    if (openSignupBtn) {
      openSignupBtn.addEventListener("click", () => {
        closeLoginPanel();
        openSignupPanel();
      });
    }

    if (signupOverlay) {
      signupOverlay.addEventListener("click", (event) => {
        if (event.target === signupOverlay) {
          closeSignupPanel();
        }
      });
    }

    if (signupCloseBtn) {
      signupCloseBtn.addEventListener("click", closeSignupPanel);
    }

    if (guestOverlay) {
      guestOverlay.addEventListener("click", (event) => {
        if (event.target === guestOverlay) {
          closeGuestPanel();
        }
      });
    }

    if (guestCloseBtn) {
      guestCloseBtn.addEventListener("click", closeGuestPanel);
    }

    if (openLoginFromSignupBtn) {
      openLoginFromSignupBtn.addEventListener("click", () => {
        closeSignupPanel();
        openLoginPanel();
      });
    }

    if (openLoginFromGuestBtn) {
      openLoginFromGuestBtn.addEventListener("click", () => {
        closeGuestPanel();
        openLoginPanel();
      });
    }

    if (loginSubmitBtn) {
      loginSubmitBtn.addEventListener("click", () => {
        const raw = loginEmailInput?.value?.trim() || "";
        if (!raw) return;
        const username = raw.includes("@") ? raw.split("@")[0] : raw;
        setAuthenticatedUser(username);
      });
    }

    if (signupSubmitBtn) {
      signupSubmitBtn.addEventListener("click", () => {
        const username = signupNameInput?.value?.trim() || "";
        if (!username) return;
        setAuthenticatedUser(username);
      });
    }

    if (guestSubmitBtn) {
      guestSubmitBtn.addEventListener("click", () => {
        const username = guestUsernameInput?.value?.trim() || "";
        if (!username) return;
        setAuthenticatedUser(username);
      });
    }

    if (userMenu) {
      userMenu.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("#logout-btn")) {
          return;
        }
        userMenu.classList.toggle("is-open");
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        logOutUser();
      });
    }

    document.addEventListener("click", (event) => {
      if (!userMenu || !userMenu.classList.contains("is-open")) return;
      if (event.target instanceof Node && !userMenu.contains(event.target)) {
        userMenu.classList.remove("is-open");
      }
    });

    for (const toggleBtn of passwordToggles) {
      toggleBtn.addEventListener("click", () => {
        const targetId = toggleBtn.getAttribute("data-target");
        if (!targetId) return;
        const passwordInput = document.getElementById(targetId);
        if (!passwordInput) return;

        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        toggleBtn.classList.toggle("is-visible", isHidden);
        toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
      });
    }

    function handleEscape() {
      closeLoginPanel();
      closeSignupPanel();
      closeGuestPanel();
      userMenu?.classList.remove("is-open");
    }

    return {
      handleEscape,
      setBubbleCount: setBubbleCountValue,
    };
}
