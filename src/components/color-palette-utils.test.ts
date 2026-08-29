import { describe, expect, it } from "vitest";
import type { ColorInfo } from "../lib/color";
import { defaultSettings } from "./color-palette-constants";
import type { ColorPaletteSettings } from "./color-palette-types";
import { exportPalette, generatePaletteColors } from "./color-palette-utils";

const baseSettings: ColorPaletteSettings = {
	...defaultSettings,
	colorCount: 3,
	hueRange: { min: 0, max: 360 },
	saturationRange: { min: 50, max: 100 },
	valueRange: { min: 50, max: 90 },
	generationAlgorithm: "random",
	sortBy: "none",
	autoSave: false,
};

const fixtureColor: ColorInfo = {
	hex: "#abcdef",
	rgb: { r: 0xab, g: 0xcd, b: 0xef },
	hsv: { h: 210, s: 28, v: 93 },
	hsl: { h: 210, s: 67, l: 80 },
};

describe("generatePaletteColors", () => {
	it("returns the requested count of unique random colors", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			generationAlgorithm: "random",
		};
		const colors = generatePaletteColors(settings);
		expect(colors).toHaveLength(3);
		const uniqueHexes = new Set(colors.map((c) => c.hex));
		expect(uniqueHexes.size).toBe(3);
	});

	it("returns golden-ratio derived colors", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			generationAlgorithm: "golden",
		};
		const colors = generatePaletteColors(settings);
		expect(colors).toHaveLength(3);
		expect(colors[0]).toBeDefined();
	});

	it("returns perceptually uniform colors", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			generationAlgorithm: "perceptual",
		};
		const colors = generatePaletteColors(settings);
		expect(colors).toHaveLength(3);
	});

	it("returns harmony-derived colors", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			generationAlgorithm: "harmony",
		};
		const colors = generatePaletteColors(settings);
		expect(colors.length).toBeGreaterThanOrEqual(1);
	});

	it("sorts colors by hue when sortBy='hue'", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			sortBy: "hue",
		};
		const colors = generatePaletteColors(settings);
		for (let i = 1; i < colors.length; i++) {
			const prev = colors[i - 1];
			const curr = colors[i];
			if (prev && curr) {
				expect(curr.hsv.h).toBeGreaterThanOrEqual(prev.hsv.h);
			}
		}
	});

	it("sorts colors by lightness when sortBy='lightness'", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			sortBy: "lightness",
		};
		const colors = generatePaletteColors(settings);
		for (let i = 1; i < colors.length; i++) {
			const prev = colors[i - 1];
			const curr = colors[i];
			if (prev && curr) {
				expect(curr.hsl.l).toBeGreaterThanOrEqual(prev.hsl.l);
			}
		}
	});

	it("sorts colors by saturation when sortBy='saturation'", () => {
		const settings: ColorPaletteSettings = {
			...baseSettings,
			sortBy: "saturation",
		};
		const colors = generatePaletteColors(settings);
		for (let i = 1; i < colors.length; i++) {
			const prev = colors[i - 1];
			const curr = colors[i];
			if (prev && curr) {
				expect(curr.hsv.s).toBeGreaterThanOrEqual(prev.hsv.s);
			}
		}
	});
});

describe("exportPalette", () => {
	it("exports CSS custom properties", () => {
		const result = exportPalette("css", "random", [fixtureColor]);
		expect(result).toContain(":root {");
		expect(result).toContain("--color-1: #abcdef;");
		expect(result).toContain("}");
	});

	it("exports Tailwind config snippet", () => {
		const result = exportPalette("tailwind", "random", [fixtureColor]);
		expect(result).toContain("module.exports");
		expect(result).toContain("color-1");
		expect(result).toContain("#abcdef");
	});

	it("exports JSON with palette metadata", () => {
		const result = exportPalette("json", "perceptual", [
			fixtureColor,
			{ ...fixtureColor, hex: "#112233" },
		]);
		const parsed = JSON.parse(result) as {
			palette: { algorithm: string; colors: ColorInfo[] };
		};
		expect(parsed.palette.algorithm).toBe("perceptual");
		expect(parsed.palette.colors).toHaveLength(2);
		expect(parsed.palette.colors[0]?.hex).toBe("#abcdef");
	});
});
