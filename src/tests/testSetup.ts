// testSetup.ts
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
//** Shape of an authentication API:
// Must have a function called login
// Return type – login is a mocked function created by Vitest */
interface AuthAPI {
    login: ReturnType<typeof vi.fn>;
}

declare global {
    interface Window {
        authAPI: AuthAPI;
    }
}

beforeEach(async () => {
    vi.resetModules();
    setupDom(); // Build the DOM

    window.authAPI = { login: vi.fn().mockResolvedValue({ success: false }) };

    // stub location (creates a mock DOM location)
    Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
    });
});

afterEach(() => {
    vi.clearAllMocks();
});