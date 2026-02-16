import { BUBBLE_DICTIONARY_CONSTANTS } from "./constants.js";

export function setupBubbleScene(options = {}) {
    const { onBubbleCountChange } = options;
    const constants = BUBBLE_DICTIONARY_CONSTANTS;
    const DOT_COUNT = constants.DOT_COUNT ?? 120;
    const INERTIA_SCALE = constants.INERTIA_SCALE ?? 0.25;
    const BUBBLE_ENTRIES = constants.BUBBLE_ENTRIES ?? [];

    const dots = [];
    const bubbles = [];
    const mergeLinks = new Map();
    const mergeParticles = [];
    const background = document.getElementById("dot-background");
    const bubble = document.getElementById("hero-bubble");
    const addBubbleBtn = document.getElementById("add-bubble-btn");
    const bubbleFront = bubble?.querySelector(".bubble-face--front");
    const bubbleBack = bubble?.querySelector(".bubble-face--back");
    let createdBubbleTotal = 0;
    let bubbleStateId = 0;
    let mergeLayer = null;
    let particleLayer = null;

    function randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    }

    function ensureMinSpeed(value, min = 0.04) {
      if (Math.abs(value) >= min) return value;
      return (value < 0 ? -1 : 1) * min;
    }

    function clampBubbleToViewport(state) {
      const radiusX = state.el.offsetWidth / 2;
      const radiusY = state.el.offsetHeight / 2;
      state.x = Math.min(Math.max(state.x, radiusX), window.innerWidth - radiusX);
      state.y = Math.min(Math.max(state.y, radiusY), window.innerHeight - radiusY);
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

    function createBubbleState(el, stateOptions = {}) {
      const state = {
        id: bubbleStateId += 1,
        el,
        x: stateOptions.x ?? window.innerWidth * 0.5,
        y: stateOptions.y ?? window.innerHeight * 0.5,
        vx: ensureMinSpeed(stateOptions.vx ?? randomBetween(-0.12, 0.12)),
        vy: ensureMinSpeed(stateOptions.vy ?? randomBetween(-0.12, 0.12)),
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
        flipped: stateOptions.flipped ?? false,
        currentFlipDeg: stateOptions.flipped ? 180 : 0,
        targetFlipDeg: stateOptions.flipped ? 180 : 0,
        movable: stateOptions.movable ?? true,
        draggable: stateOptions.draggable ?? false,
        isEditing: stateOptions.isEditing ?? false,
        word: stateOptions.word ?? "",
        definition: stateOptions.definition ?? "",
        mergePulseStart: -1,
        mergePulseDurationMs: 200,
      };

      clampBubbleToViewport(state);
      return state;
    }

    function getPairKey(aId, bId) {
      return aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
    }

    function getBubbleRadius(state) {
      return Math.max(state.el.offsetWidth, state.el.offsetHeight) * 0.5;
    }

    function isOverlappingForMerge(aState, bState) {
      const dx = aState.x - bState.x;
      const dy = aState.y - bState.y;
      const distance = Math.hypot(dx, dy);
      const mergeDistance = (getBubbleRadius(aState) + getBubbleRadius(bState)) * 0.72;
      return distance <= mergeDistance;
    }

    function ensureMergeLayer() {
      if (mergeLayer) return mergeLayer;
      const layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      layer.classList.add("bubble-links-layer");
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
      mergeLayer = layer;
      return mergeLayer;
    }

    function ensureParticleLayer() {
      if (particleLayer) return particleLayer;
      const layer = document.createElement("div");
      layer.classList.add("bubble-particles-layer");
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
      particleLayer = layer;
      return particleLayer;
    }

    function addMergeLink(aState, bState) {
      const key = getPairKey(aState.id, bState.id);
      if (mergeLinks.has(key)) return false;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.classList.add("bubble-merge-link");
      ensureMergeLayer().appendChild(line);
      mergeLinks.set(key, { aState, bState, line });
      return true;
    }

    function cleanupInvalidMergeLinks() {
      for (const [key, link] of mergeLinks.entries()) {
        if (!link.aState?.el?.isConnected || !link.bState?.el?.isConnected) {
          link.line.remove();
          mergeLinks.delete(key);
        }
      }
    }

    function tryMergeOnDrop(sourceState) {
      if (!sourceState || sourceState.isEditing) return;
      let nearestTarget = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const targetState of bubbles) {
        if (targetState === sourceState || targetState.isEditing) continue;
        if (!isOverlappingForMerge(sourceState, targetState)) continue;
        const distance = Math.hypot(sourceState.x - targetState.x, sourceState.y - targetState.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = targetState;
        }
      }

      if (nearestTarget) {
        const didCreateLink = addMergeLink(sourceState, nearestTarget);
        if (didCreateLink) {
          triggerMergeEffect(sourceState, nearestTarget);
        }
      }
    }

    function triggerMergeEffect(aState, bState) {
      const nowMs = performance.now();
      aState.mergePulseStart = nowMs;
      bState.mergePulseStart = nowMs;
      separateMergedBubbles(aState, bState);
      spawnMergeParticles((aState.x + bState.x) * 0.5, (aState.y + bState.y) * 0.5);
    }

    function separateMergedBubbles(aState, bState) {
      let dx = aState.x - bState.x;
      let dy = aState.y - bState.y;
      let distance = Math.hypot(dx, dy);

      if (distance < 0.001) {
        const angle = randomBetween(0, Math.PI * 2);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        distance = 1;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const targetDistance = Math.max(aState.el.offsetWidth, bState.el.offsetWidth);
      const halfDistance = targetDistance * 0.5;
      const midX = (aState.x + bState.x) * 0.5;
      const midY = (aState.y + bState.y) * 0.5;

      aState.x = midX + nx * halfDistance;
      aState.y = midY + ny * halfDistance;
      bState.x = midX - nx * halfDistance;
      bState.y = midY - ny * halfDistance;

      clampBubbleToViewport(aState);
      clampBubbleToViewport(bState);

      aState.vx += nx * 0.5;
      aState.vy += ny * 0.5;
      bState.vx -= nx * 0.5;
      bState.vy -= ny * 0.5;
    }

    function spawnMergeParticles(x, y) {
      const count = 18;
      const layer = ensureParticleLayer();
      for (let i = 0; i < count; i += 1) {
        const el = document.createElement("span");
        el.className = "bubble-merge-particle";
        const angle = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(0.9, 2.8);
        const size = randomBetween(3, 8);
        const life = randomBetween(420, 760);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        layer.appendChild(el);
        mergeParticles.push({
          el,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - randomBetween(0.2, 0.7),
          bornAt: performance.now(),
          lifeMs: life,
        });
      }
    }

    function updateMergeParticles(nowMs) {
      for (let i = mergeParticles.length - 1; i >= 0; i -= 1) {
        const particle = mergeParticles[i];
        const elapsed = nowMs - particle.bornAt;
        const t = elapsed / particle.lifeMs;
        if (t >= 1) {
          particle.el.remove();
          mergeParticles.splice(i, 1);
          continue;
        }
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.03;
        const fade = 1 - t;
        particle.el.style.opacity = `${fade}`;
        particle.el.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0) translate(-50%, -50%) scale(${0.6 + fade * 0.8})`;
      }
    }

    function getMergeScale(state, nowMs) {
      if (state.mergePulseStart < 0) return 1;
      const elapsed = nowMs - state.mergePulseStart;
      if (elapsed >= state.mergePulseDurationMs) {
        state.mergePulseStart = -1;
        return 1;
      }
      const t = elapsed / state.mergePulseDurationMs;
      return 1 - 0.2 * Math.sin(Math.PI * t);
    }

    function resolveBubbleCollisions() {
      for (let i = 0; i < bubbles.length; i += 1) {
        const aState = bubbles[i];
        if (!aState?.el?.isConnected || aState.isEditing) continue;

        for (let j = i + 1; j < bubbles.length; j += 1) {
          const bState = bubbles[j];
          if (!bState?.el?.isConnected || bState.isEditing) continue;
          if (aState.dragging || bState.dragging) continue;
          if (!aState.movable && !bState.movable) continue;

          let dx = bState.x - aState.x;
          let dy = bState.y - aState.y;
          let distance = Math.hypot(dx, dy);
          const minDistance = getBubbleRadius(aState) + getBubbleRadius(bState);
          if (distance >= minDistance) continue;

          if (distance < 0.001) {
            const angle = randomBetween(0, Math.PI * 2);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }

          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;

          let pushA = 0;
          let pushB = 0;
          if (aState.movable && bState.movable) {
            pushA = overlap * 0.5;
            pushB = overlap * 0.5;
          } else if (aState.movable) {
            pushA = overlap;
          } else if (bState.movable) {
            pushB = overlap;
          }

          if (aState.movable) {
            aState.x -= nx * pushA;
            aState.y -= ny * pushA;
            clampBubbleToViewport(aState);
          }
          if (bState.movable) {
            bState.x += nx * pushB;
            bState.y += ny * pushB;
            clampBubbleToViewport(bState);
          }

          const relVX = bState.vx - aState.vx;
          const relVY = bState.vy - aState.vy;
          const relNormalSpeed = relVX * nx + relVY * ny;
          if (relNormalSpeed >= 0) continue;

          const restitution = 0.9;
          if (aState.movable && bState.movable) {
            const impulse = ((1 + restitution) * relNormalSpeed) / 2;
            aState.vx += impulse * nx;
            aState.vy += impulse * ny;
            bState.vx -= impulse * nx;
            bState.vy -= impulse * ny;
          } else if (aState.movable) {
            const impulse = (1 + restitution) * relNormalSpeed;
            aState.vx += impulse * nx;
            aState.vy += impulse * ny;
          } else if (bState.movable) {
            const impulse = (1 + restitution) * relNormalSpeed;
            bState.vx -= impulse * nx;
            bState.vy -= impulse * ny;
          }
        }
      }
    }

    function bindDraggableBubble(state) {
      const { el } = state;
      if (!el || !state.draggable) return;

      function startDragging(event) {
        if (state.isEditing) return;
        state.dragging = true;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        state.dragOffsetX = event.clientX - centerX;
        state.dragOffsetY = event.clientY - centerY;
        state.lastPointerX = event.clientX;
        state.lastPointerY = event.clientY;
        state.lastPointerTime = performance.now();
        state.pointerStartX = event.clientX;
        state.pointerStartY = event.clientY;
        state.movedDuringPointer = false;
        state.lastDragVX = 0;
        state.lastDragVY = 0;

        el.classList.add("is-grabbing");
        el.setPointerCapture(event.pointerId);
      }

      function moveDragging(event) {
        if (!state.dragging) return;
        const nowMs = performance.now();
        const dt = Math.max(nowMs - state.lastPointerTime, 1);
        const instantVX = ((event.clientX - state.lastPointerX) / dt) * 16.667 * INERTIA_SCALE;
        const instantVY = ((event.clientY - state.lastPointerY) / dt) * 16.667 * INERTIA_SCALE;

        state.lastDragVX = instantVX;
        state.lastDragVY = instantVY;
        if (!state.movedDuringPointer) {
          const movedX = Math.abs(event.clientX - state.pointerStartX);
          const movedY = Math.abs(event.clientY - state.pointerStartY);
          if (movedX > 6 || movedY > 6) {
            state.movedDuringPointer = true;
          }
        }

        state.x = event.clientX - state.dragOffsetX;
        state.y = event.clientY - state.dragOffsetY;
        clampBubbleToViewport(state);

        state.lastPointerX = event.clientX;
        state.lastPointerY = event.clientY;
        state.lastPointerTime = nowMs;
      }

      function stopDragging(event) {
        if (!state.dragging) return;
        state.dragging = false;
        if (state.movedDuringPointer) {
          state.vx = state.lastDragVX;
          state.vy = state.lastDragVY;
          tryMergeOnDrop(state);
        } else {
          state.vx = 0;
          state.vy = 0;
          state.flipped = !state.flipped;
          state.targetFlipDeg = state.flipped ? 180 : 0;
          el.classList.toggle("is-flipped", state.flipped);
        }

        el.classList.remove("is-grabbing");
        if (el.hasPointerCapture(event.pointerId)) {
          el.releasePointerCapture(event.pointerId);
        }
      }

      el.addEventListener("pointerdown", startDragging);
      el.addEventListener("pointermove", moveDragging);
      el.addEventListener("pointerup", stopDragging);
      el.addEventListener("pointercancel", stopDragging);
      el.addEventListener("lostpointercapture", () => {
        state.dragging = false;
        el.classList.remove("is-grabbing");
      });
    }

    function setInputOnFace(faceEl, placeholder, submitCallback) {
      faceEl.textContent = "";
      const input = document.createElement("input");
      input.className = "bubble-input";
      input.type = "text";
      input.placeholder = placeholder;
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        submitCallback(value);
      });

      faceEl.appendChild(input);
      requestAnimationFrame(() => input.focus());
    }

    function finalizeCreatedBubble(state, frontFace, backFace, definition) {
      state.definition = definition;
      state.flipped = false;
      state.targetFlipDeg = 0;
      state.currentFlipDeg = 180;
      state.isEditing = false;
      state.movable = true;
      state.vx = ensureMinSpeed(randomBetween(-0.14, 0.14));
      state.vy = ensureMinSpeed(randomBetween(-0.14, 0.14));

      frontFace.textContent = state.word;
      backFace.textContent = state.definition;
      state.el.classList.remove("is-editing", "is-flipped");

      createdBubbleTotal += 1;
      if (typeof onBubbleCountChange === "function") {
        onBubbleCountChange(createdBubbleTotal);
      }
    }

    function startDefinitionStep(state, frontFace, backFace) {
      state.flipped = true;
      state.targetFlipDeg = 180;
      state.el.classList.add("is-flipped");

      window.setTimeout(() => {
        setInputOnFace(backFace, "Type definition and press Enter", (definition) => {
          finalizeCreatedBubble(state, frontFace, backFace, definition);
        });
      }, 260);
    }

    function createEditableBubble() {
      const newBubble = document.createElement("div");
      newBubble.className = "dictionary-bubble is-editing";
      newBubble.innerHTML = `
        <span class="bubble-face bubble-face--front"></span>
        <span class="bubble-face bubble-face--back"></span>
      `;
      document.body.appendChild(newBubble);

      const frontFace = newBubble.querySelector(".bubble-face--front");
      const backFace = newBubble.querySelector(".bubble-face--back");
      if (!frontFace || !backFace) {
        newBubble.remove();
        return;
      }

      const state = createBubbleState(newBubble, {
        x: 160,
        y: window.innerHeight - 170,
        vx: 0,
        vy: 0,
        movable: false,
        draggable: true,
        isEditing: true,
        flipped: false,
      });

      bubbles.push(state);
      bindDraggableBubble(state);
      setInputOnFace(frontFace, "Type word and press Enter", (word) => {
        state.word = word;
        startDefinitionStep(state, frontFace, backFace);
      });
    }

    function cancelActiveBubbleCreation() {
      let canceled = false;
      for (let i = bubbles.length - 1; i >= 0; i -= 1) {
        const state = bubbles[i];
        if (!state?.isEditing) continue;
        state.el?.remove();
        bubbles.splice(i, 1);
        canceled = true;
      }
      return canceled;
    }

    if (!background || !bubble || !bubbleFront || !bubbleBack) {
      console.warn("Bubble scene not initialized: missing required DOM elements.");
      return {
        cancelActiveBubbleCreation,
        getCreatedBubbleTotal: () => createdBubbleTotal,
      };
    }

    const selectedEntry = BUBBLE_ENTRIES[Math.floor(Math.random() * BUBBLE_ENTRIES.length)];
    if (selectedEntry) {
      bubbleFront.textContent = selectedEntry.word;
      bubbleBack.textContent = selectedEntry.definition;
    }

    for (let i = 0; i < DOT_COUNT; i += 1) {
      dots.push(createDot());
    }

    const heroState = createBubbleState(bubble, {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      vx: randomBetween(-0.12, 0.12),
      vy: randomBetween(-0.12, 0.12),
      movable: true,
      draggable: true,
      flipped: false,
    });
    bubbles.push(heroState);
    bindDraggableBubble(heroState);

    if (addBubbleBtn) {
      addBubbleBtn.addEventListener("click", createEditableBubble);
    }

    function animate() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const now = performance.now() * 0.001;
      const nowMs = performance.now();

      for (const dot of dots) {
        dot.x += dot.vx + Math.sin(now + dot.phase) * dot.drift * 0.04;
        dot.y += dot.vy + Math.cos(now + dot.phase) * dot.drift * 0.04;

        if (dot.x < -12) dot.x = width + 12;
        if (dot.x > width + 12) dot.x = -12;
        if (dot.y < -12) dot.y = height + 12;
        if (dot.y > height + 12) dot.y = -12;

        dot.el.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
      }

      for (const state of bubbles) {
        if (!state.dragging && state.movable) {
          state.x += state.vx;
          state.y += state.vy;

          const radiusX = state.el.offsetWidth / 2;
          const radiusY = state.el.offsetHeight / 2;

          if (state.x <= radiusX || state.x >= width - radiusX) {
            state.vx *= -1;
            state.x = Math.min(Math.max(state.x, radiusX), width - radiusX);
          }

          if (state.y <= radiusY || state.y >= height - radiusY) {
            state.vy *= -1;
            state.y = Math.min(Math.max(state.y, radiusY), height - radiusY);
          }
        }
      }
      resolveBubbleCollisions();

      for (const state of bubbles) {
        state.currentFlipDeg += (state.targetFlipDeg - state.currentFlipDeg) * 0.18;
        const mergeScale = getMergeScale(state, nowMs);
        state.el.style.filter = "brightness(1)";
        state.el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%) scale(${mergeScale}) rotateY(${state.currentFlipDeg}deg)`;
      }

      cleanupInvalidMergeLinks();
      for (const link of mergeLinks.values()) {
        link.line.setAttribute("x1", `${link.aState.x}`);
        link.line.setAttribute("y1", `${link.aState.y}`);
        link.line.setAttribute("x2", `${link.bState.x}`);
        link.line.setAttribute("y2", `${link.bState.y}`);
      }
      updateMergeParticles(nowMs);

      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => {
      for (const dot of dots) {
        if (dot.x > window.innerWidth) dot.x = randomBetween(0, window.innerWidth);
        if (dot.y > window.innerHeight) dot.y = randomBetween(0, window.innerHeight);
      }

      for (const state of bubbles) {
        clampBubbleToViewport(state);
      }
    });

    clampBubbleToViewport(heroState);
    requestAnimationFrame(animate);

    return {
      cancelActiveBubbleCreation,
      getCreatedBubbleTotal: () => createdBubbleTotal,
    };
}
