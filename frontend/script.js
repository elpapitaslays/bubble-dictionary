import { setupAuthUI } from "./js/auth-ui.js";
import { setupBubbleScene } from "./js/bubble-scene.js";

if (typeof setupAuthUI !== "function" || typeof setupBubbleScene !== "function") {
  console.warn("App not initialized: required modules were not loaded.");
} else {
  const authUI = setupAuthUI();
  const bubbleScene = setupBubbleScene({
    onBubbleCountChange: authUI.setBubbleCount,
  });

  authUI.setBubbleCount(bubbleScene.getCreatedBubbleTotal());

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    bubbleScene.cancelActiveBubbleCreation();
    authUI.handleEscape();
  });
}
