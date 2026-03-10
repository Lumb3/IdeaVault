import { afterEach, beforeEach, describe, vi, it, expect } from "vitest";

describe("login UI", () => {

    it("toggle password visibility and icon classes", () => {
        const toggle = document.getElementById("togglePassword");
        const pass = document.getElementById("password");
        console.log("Here is the innerHTML part: ");
        console.log(document.body.innerHTML);
        expect(pass?.getAttribute("type") ?? "").toBe("password");


    })
});