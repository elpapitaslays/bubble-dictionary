const DOT_COUNT = 120;
const dots = [];
const background = document.getElementById("dot-background");
const bubble = document.getElementById("hero-bubble");
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
