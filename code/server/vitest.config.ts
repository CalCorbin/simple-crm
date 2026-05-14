import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: { syntax: "typescript", decorators: true },
                transform: { decoratorMetadata: true },
                target: "es2022",
            },
        }),
    ],
    test: {
        setupFiles: ["./src/__tests__/setup.ts"],
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.ts"],
            exclude: ["src/__tests__/**", "src/seed.ts"],
        },
    },
});
