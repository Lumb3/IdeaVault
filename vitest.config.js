import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        // include: ['src/tests/**/*.{test,spec}.{js,ts}'],
        // exclude: ['node_modules', 'release', 'build']
    }
})