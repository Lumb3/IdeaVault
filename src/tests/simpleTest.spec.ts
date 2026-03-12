import { expect, describe, it } from "vitest";

describe("first test", () => {
    it("ten equals ten", () => {
        expect(10).toBe(10);
    })
    it("length of a name", () => {
        let name = "Eric";
        expect(4).toBe(name.length);
    })
    it("add function", () => {
        const sum = 10 + 0;
        expect(10).toBe(sum);
    })  
});