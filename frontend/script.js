const DOT_COUNT = 120;
const dots = [];
const background = document.getElementById("dot-background");
const bubble = document.getElementById("hero-bubble");
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
const bubbleFront = bubble?.querySelector(".bubble-face--front");
const bubbleBack = bubble?.querySelector(".bubble-face--back");
const INERTIA_SCALE = 0.25;
const BUBBLE_ENTRIES = [
  { word: "lexicon", definition: "The full set of words used in a language." },
  { word: "syntax", definition: "The rules that organize words into sentences." },
  { word: "idiom", definition: "A phrase whose meaning differs from literal words." },
  { word: "nuance", definition: "A subtle difference in meaning or feeling." },
  { word: "dialect", definition: "A regional or social variety of a language." },
  { word: "context", definition: "The surrounding text or situation that gives meaning." },
  { word: "grammar", definition: "The system of rules for word and sentence structure." },
  { word: "phrase", definition: "A small group of words acting as a unit." },
  { word: "vocabulary", definition: "The words known or used by a person or field." },
  { word: "semantics", definition: "The branch of meaning in language and logic." },
];

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
  if (bubbleCount) bubbleCount.textContent = "0";
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

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLoginPanel();
    closeSignupPanel();
    closeGuestPanel();
    userMenu?.classList.remove("is-open");
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

if (!background || !bubble || !bubbleFront || !bubbleBack) {
  console.warn("Bubble scene not initialized: missing required DOM elements.");
} else {
const selectedEntry = BUBBLE_ENTRIES[Math.floor(Math.random() * BUBBLE_ENTRIES.length)];
bubbleFront.textContent = selectedEntry.word;
bubbleBack.textContent = selectedEntry.definition;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createDot() {
  const dot = document.createElement("span");
  dot.className = "dot";

  const size = randomBetween(2, 10);
  const brightness = randomBetween(35, 90);

  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  dot.style.background = `hsl(0 0% ${brightness}%)`;
  dot.style.opacity = `${randomBetween(0.2, 0.75)}`;

  background.appendChild(dot);

  return {
    el: dot,
    x: randomBetween(0, window.innerWidth),
    y: randomBetween(0, window.innerHeight),
    vx: randomBetween(-0.14, 0.14),
    vy: randomBetween(-0.14, 0.14),
    drift: randomBetween(0.05, 0.35),
    phase: randomBetween(0, Math.PI * 2),
  };
}

for (let i = 0; i < DOT_COUNT; i += 1) {
  dots.push(createDot());
}

const bubbleState = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  vx: randomBetween(-0.12, 0.12),
  vy: randomBetween(-0.12, 0.12),
  dragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  lastPointerTime: 0,
  lastDragVX: 0,
  lastDragVY: 0,
  pointerStartX: 0,
  pointerStartY: 0,
  movedDuringPointer: false,
  flipped: false,
  currentFlipDeg: 0,
  targetFlipDeg: 0,
};

if (Math.abs(bubbleState.vx) < 0.04) {
  bubbleState.vx = (bubbleState.vx < 0 ? -1 : 1) * 0.04;
}

if (Math.abs(bubbleState.vy) < 0.04) {
  bubbleState.vy = (bubbleState.vy < 0 ? -1 : 1) * 0.04;
}

function clampBubbleToViewport() {
  const radiusX = bubble.offsetWidth / 2;
  const radiusY = bubble.offsetHeight / 2;
  bubbleState.x = Math.min(Math.max(bubbleState.x, radiusX), window.innerWidth - radiusX);
  bubbleState.y = Math.min(Math.max(bubbleState.y, radiusY), window.innerHeight - radiusY);
}

function startDragging(event) {
  bubbleState.dragging = true;
  const rect = bubble.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  bubbleState.dragOffsetX = event.clientX - centerX;
  bubbleState.dragOffsetY = event.clientY - centerY;
  bubbleState.lastPointerX = event.clientX;
  bubbleState.lastPointerY = event.clientY;
  bubbleState.lastPointerTime = performance.now();
  bubbleState.pointerStartX = event.clientX;
  bubbleState.pointerStartY = event.clientY;
  bubbleState.movedDuringPointer = false;
  bubbleState.lastDragVX = 0;
  bubbleState.lastDragVY = 0;

  bubble.classList.add("is-grabbing");
  bubble.setPointerCapture(event.pointerId);
}

function moveDragging(event) {
  if (!bubbleState.dragging) return;
  const nowMs = performance.now();
  const dt = Math.max(nowMs - bubbleState.lastPointerTime, 1);
  const instantVX = ((event.clientX - bubbleState.lastPointerX) / dt) * 16.667 * INERTIA_SCALE;
  const instantVY = ((event.clientY - bubbleState.lastPointerY) / dt) * 16.667 * INERTIA_SCALE;

  bubbleState.lastDragVX = instantVX;
  bubbleState.lastDragVY = instantVY;
  if (!bubbleState.movedDuringPointer) {
    const movedX = Math.abs(event.clientX - bubbleState.pointerStartX);
    const movedY = Math.abs(event.clientY - bubbleState.pointerStartY);
    if (movedX > 6 || movedY > 6) {
      bubbleState.movedDuringPointer = true;
    }
  }

  bubbleState.x = event.clientX - bubbleState.dragOffsetX;
  bubbleState.y = event.clientY - bubbleState.dragOffsetY;
  clampBubbleToViewport();

  bubbleState.lastPointerX = event.clientX;
  bubbleState.lastPointerY = event.clientY;
  bubbleState.lastPointerTime = nowMs;
}

function stopDragging(event) {
  if (!bubbleState.dragging) return;
  bubbleState.dragging = false;
  if (bubbleState.movedDuringPointer) {
    bubbleState.vx = bubbleState.lastDragVX;
    bubbleState.vy = bubbleState.lastDragVY;
  } else {
    bubbleState.vx = 0;
    bubbleState.vy = 0;
    bubbleState.flipped = !bubbleState.flipped;
    bubbleState.targetFlipDeg = bubbleState.flipped ? 180 : 0;
    bubble.classList.toggle("is-flipped", bubbleState.flipped);
  }
  bubble.classList.remove("is-grabbing");
  if (bubble.hasPointerCapture(event.pointerId)) {
    bubble.releasePointerCapture(event.pointerId);
  }
}

bubble.addEventListener("pointerdown", startDragging);
bubble.addEventListener("pointermove", moveDragging);
bubble.addEventListener("pointerup", stopDragging);
bubble.addEventListener("pointercancel", stopDragging);
bubble.addEventListener("lostpointercapture", () => {
  bubbleState.dragging = false;
  bubble.classList.remove("is-grabbing");
});

function animate() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const now = performance.now() * 0.001;

  for (const dot of dots) {
    dot.x += dot.vx + Math.sin(now + dot.phase) * dot.drift * 0.04;
    dot.y += dot.vy + Math.cos(now + dot.phase) * dot.drift * 0.04;

    if (dot.x < -12) dot.x = width + 12;
    if (dot.x > width + 12) dot.x = -12;
    if (dot.y < -12) dot.y = height + 12;
    if (dot.y > height + 12) dot.y = -12;

    dot.el.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
  }

  if (!bubbleState.dragging) {
    bubbleState.x += bubbleState.vx;
    bubbleState.y += bubbleState.vy;

    const radiusX = bubble.offsetWidth / 2;
    const radiusY = bubble.offsetHeight / 2;

    if (bubbleState.x <= radiusX || bubbleState.x >= width - radiusX) {
      bubbleState.vx *= -1;
      bubbleState.x = Math.min(Math.max(bubbleState.x, radiusX), width - radiusX);
    }

    if (bubbleState.y <= radiusY || bubbleState.y >= height - radiusY) {
      bubbleState.vy *= -1;
      bubbleState.y = Math.min(Math.max(bubbleState.y, radiusY), height - radiusY);
    }
  }

  bubbleState.currentFlipDeg += (bubbleState.targetFlipDeg - bubbleState.currentFlipDeg) * 0.18;
  bubble.style.filter = "brightness(1)";
  bubble.style.transform = `translate3d(${bubbleState.x}px, ${bubbleState.y}px, 0) translate(-50%, -50%) scale(1) rotateY(${bubbleState.currentFlipDeg}deg)`;

  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  for (const dot of dots) {
    if (dot.x > window.innerWidth) dot.x = randomBetween(0, window.innerWidth);
    if (dot.y > window.innerHeight) dot.y = randomBetween(0, window.innerHeight);
  }

  clampBubbleToViewport();
});

clampBubbleToViewport();
requestAnimationFrame(animate);
}
