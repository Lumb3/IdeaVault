import { beforeEach, vi, afterEach } from "vitest";
// Dom setup goes in here
function setupDom() {
    document.body.innerHTML = `
    <input id="username" />
    <input id="password" type="password" />
    <i id="togglePassword" class="fa-eye"></i>
    <i id="toggleLock"></i>
    <div id="alert" style="display:none"></div>
    <button id="loginBtn"></button>
    <button id="signupBtn"></button>
  `;
}

beforeEach(async () => {
    setupDom(); // Run the DOM
    (window as any).authAPI = {
        login: vi.fn()
    };

    // stub location (creates a mock DOM location)
    Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
    });

    // import the login script after dom is ready
    // await import("../login");
});
afterEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
});