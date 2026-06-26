import { renderLoginPage } from "./auth.js";

export function initLanding() {
    const app = document.getElementById("app");

    document.getElementById("getStartedBtn")?.addEventListener("click", () => {
        renderLoginPage(app);
    });

    document.getElementById("loginBtn")?.addEventListener("click", () => {
        renderLoginPage(app);
    });
}