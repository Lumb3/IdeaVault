// login.spec.ts
import { afterEach, beforeEach, describe, vi, it, expect } from "vitest";

describe("login UI", () => {

    it("toggle password visibility and icon classes (direct call from login.js)", async () => {
        //** When we import the whole login.js module, JS does this:
        // 1. Load the module file
        // 2. Execute all code in the file
        // 3. Collect the exported values
        // 4. Return them to your import */
        const { toggleEyes } = await import("../login"); // import the module

        const toggle = document.getElementById("togglePassword");
        const pass = document.getElementById("password");

        expect(pass?.getAttribute("type") ?? "").toBe("password");

        toggleEyes.call(toggle);

        console.log("Expected password type: ");
        expect(pass?.getAttribute("type")).toBe("text");
        console.log("Expected icon change: ");
        expect(toggle?.classList.contains("fa-eye-slash")).toBe(true);
    });
});