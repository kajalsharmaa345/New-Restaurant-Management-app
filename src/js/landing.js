import { navigateTo } from './router.js';

export function initLanding() {
  const getStartedBtn = document.getElementById("getStartedBtn");
  const loginBtn = document.getElementById("loginBtn");

  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      navigateTo("/signup");
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      navigateTo("/login");
    });
  }
}