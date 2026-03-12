// login.spec.ts
import { afterEach, beforeEach, describe, vi, it, expect } from "vitest";

async function importLogin() {
    vi.resetModules();
    return await import("../login");
}


describe("login UI", () => {

    it("toggle password visibility and icon classes (direct call from login.js)", async () => {
        //** When we import the whole login.js module, JS does this:
        // 1. Load the module file
        // 2. Execute all code in the file
        // 3. Collect the exported values
        // 4. Return them to your import */
        const { toggleEyes } = await importLogin(); // import the module

        const toggle = document.getElementById("togglePassword");
        const pass = document.getElementById("password");

        expect(pass?.getAttribute("type") ?? "").toBe("password");

        toggleEyes.call(toggle);

        console.log("Expected password type: ");
        expect(pass?.getAttribute("type")).toBe("text");
        console.log("Expected icon change: ");
        expect(toggle?.classList.contains("fa-eye-slash")).toBe(true);
    });

    it("Enter key triggers login button click", async () => {
        await importLogin();

        const loginButton = document.getElementById("loginBtn") as HTMLButtonElement;
        const clickSpy = vi.spyOn(loginButton, "click");

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it("successful login shows succss, opens lock, then redirects", async () => {
        vi.useFakeTimers();
        await importLogin();

        const loginButton = document.getElementById("loginBtn") as HTMLButtonElement;
        const alertBox = document.getElementById("alert") as HTMLDivElement;
        const toggleLock = document.getElementById("toggleLock") as HTMLElement;

        window.authAPI.login.mockResolvedValueOnce({
            success: true,
        });

        loginButton.click();

        // allow async handler to resolve
        await Promise.resolve();

        expect(toggleLock.classList.contains("fa-lock-open")).toBe(true);
        expect(alertBox.classList.contains("success")).toBe(true);
        expect(alertBox.style.display).toBe("block");
        expect(alertBox.textContent).toBe("Login Successful");

        vi.advanceTimersByTime(800);

        expect(alertBox.style.display).toBe("none");
        expect(window.location.href).toBe("index.html");
    });

    it("unsuccessful login shows an error message", async () => {
        await importLogin();

        const alert = document.getElementById("alert") as HTMLDivElement;
        const loginButton = document.getElementById("loginBtn") as HTMLButtonElement;
        const toggleLock = document.getElementById ("toggleLock") as HTMLElement;
    

        window.authAPI.login.mockResolvedValueOnce({
            success: false,
        });

        loginButton.click();

        await Promise.resolve();

        expect(alert.classList.contains("error")).toBe(true);
        expect(toggleLock.classList.contains("fa-lock-open")).toBe(false);
        expect(alert.textContent).toBe("Incorrect username or password");
        expect(alert.style.display).toBe("block");
    })
});