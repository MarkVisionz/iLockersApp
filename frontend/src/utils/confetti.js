// src/utils/confetti.js
import confetti from "canvas-confetti";

export const launchConfetti = () => {
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    zIndex: 9999,
  });
};
