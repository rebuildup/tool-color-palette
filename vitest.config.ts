import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/**/index.ts",
				"src/**/types.ts",
				// React components require Testing Library, deferred.
				// Tracked in docs/adr/0001-tool-stack.md (re-evaluation conditions).
				"src/ColorPaletteApp.tsx",
				"src/components/ColorPalette*.tsx",
				"src/components/GeneratedPalette.tsx",
				"src/components/PaletteActions.tsx",
				"src/components/PaletteExport.tsx",
				"src/components/RawDOMContainer.tsx",
				"src/components/SavedPalettes.tsx",
			],
			thresholds: {
				lines: 80,
				statements: 80,
				functions: 80,
				branches: 80,
			},
		},
	},
});
