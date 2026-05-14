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
    },
});
