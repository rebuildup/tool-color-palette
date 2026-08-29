import { describe, expect, it } from "vitest";
import {
	generateColorHarmony,
	generateGoldenRatioColors,
	generatePerceptuallyUniformColors,
	getAccessibilityInfo,
	getContrastRatio,
	getLuminance,
	hsvToRgb,
	isColorBlindSafe,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
	sortColorsByHue,
	sortColorsByLightness,
	sortColorsBySaturation,
} from "./color";

describe("hsvToRgb", () => {
	it("returns pure red for h=0, s=100, v=100", () => {
		expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("returns pure green for h=120, s=100, v=100", () => {
		expect(hsvToRgb(120, 100, 100)).toEqual({ r: 0, g: 255, b: 0 });
	});

	it("returns pure blue for h=240, s=100, v=100", () => {
		expect(hsvToRgb(240, 100, 100)).toEqual({ r: 0, g: 0, b: 255 });
	});

	it("returns black for v=0 regardless of hue", () => {
		expect(hsvToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
		expect(hsvToRgb(180, 50, 0)).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("returns white for s=0, v=100", () => {
		expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
		expect(hsvToRgb(200, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("normalizes hue values outside 0-360 range", () => {
		expect(hsvToRgb(360, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
		expect(hsvToRgb(-120, 100, 100)).toEqual(hsvToRgb(240, 100, 100));
	});
});

describe("rgbToHsv", () => {
	it("converts pure red", () => {
		expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
	});

	it("converts pure green", () => {
		expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 100, v: 100 });
	});

	it("converts pure blue", () => {
		expect(rgbToHsv(0, 0, 255)).toEqual({ h: 240, s: 100, v: 100 });
	});

	it("converts yellow (max red, g>b)", () => {
		const result = rgbToHsv(255, 255, 0);
		expect(result.h).toBe(60);
		expect(result.s).toBe(100);
		expect(result.v).toBe(100);
	});

	it("converts cyan (max green)", () => {
		const result = rgbToHsv(0, 255, 255);
		expect(result.h).toBe(180);
	});

	it("converts magenta (max blue)", () => {
		const result = rgbToHsv(255, 0, 255);
		expect(result.h).toBe(300);
	});

	it("converts when red is max and b>g (hue wrap)", () => {
		// red=200, green=50, blue=150 → red max, b > g
		const result = rgbToHsv(200, 50, 150);
		expect(result.h).toBeGreaterThan(300);
	});

	it("returns zero saturation for black", () => {
		expect(rgbToHsv(0, 0, 0).s).toBe(0);
	});

	it("treats NaN inputs as zero", () => {
		expect(rgbToHsv(Number.NaN, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
	});
});

describe("rgbToHsl", () => {
	it("converts pure red to HSL", () => {
		expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
	});

	it("returns achromatic for equal RGB", () => {
		expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
	});

	it("handles max=green branch", () => {
		const result = rgbToHsl(0, 255, 0);
		expect(result.h).toBe(120);
		expect(result.s).toBe(100);
		expect(result.l).toBe(50);
	});

	it("handles max=blue branch", () => {
		const result = rgbToHsl(0, 0, 255);
		expect(result.h).toBe(240);
		expect(result.s).toBe(100);
		expect(result.l).toBe(50);
	});

	it("computes higher saturation for darker colors", () => {
		const result = rgbToHsl(100, 50, 50);
		expect(result.s).toBeGreaterThan(0);
		expect(result.l).toBeLessThan(50);
	});
});

describe("rgbToHex", () => {
	it("formats RGB as 6-character hex with leading hash", () => {
		expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
		expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
		expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
		expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
	});

	it("pads single-digit channels with zero", () => {
		expect(rgbToHex(1, 2, 3)).toBe("#010203");
	});
});

describe("getLuminance / getContrastRatio / getAccessibilityInfo", () => {
	it("computes higher luminance for white than for black", () => {
		expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(
			getLuminance({ r: 0, g: 0, b: 0 }),
		);
	});

	it("returns contrast ratio of 1 for identical colors", () => {
		const c = { r: 100, g: 100, b: 100 };
		expect(getContrastRatio(c, c)).toBeCloseTo(1, 5);
	});

	it("returns maximum contrast ratio for white vs black", () => {
		const ratio = getContrastRatio(
			{ r: 255, g: 255, b: 255 },
			{ r: 0, g: 0, b: 0 },
		);
		expect(ratio).toBeCloseTo(21, 1);
	});

	it("flags high-contrast colors as WCAG AA compliant", () => {
		const info = getAccessibilityInfo({ r: 0, g: 0, b: 0 });
		expect(info.wcagAA).toBe(true);
		expect(info.wcagAAA).toBe(true);
		expect(info.contrastWithWhite).toBeGreaterThanOrEqual(7);
		expect(info.contrastWithBlack).toBeLessThan(4.5);
	});
});

describe("isColorBlindSafe", () => {
	it("returns true for vibrant colors", () => {
		expect(isColorBlindSafe({ r: 255, g: 0, b: 0 })).toBe(true);
	});

	it("returns false for low-saturation colors", () => {
		expect(isColorBlindSafe({ r: 200, g: 200, b: 200 })).toBe(false);
	});
});

describe("generateColorHarmony", () => {
	it("returns base color first", () => {
		const base = { h: 0, s: 100, v: 100 };
		const harmony = generateColorHarmony(base, "complementary");
		expect(harmony.colors[0]?.hex).toBe("#ff0000");
	});

	it("complementary type adds the 180-degree opposite", () => {
		const harmony = generateColorHarmony({ h: 0, s: 100, v: 100 }, "complementary");
		expect(harmony.colors.length).toBeGreaterThan(1);
		expect(harmony.type).toBe("complementary");
	});

	it("triadic adds two extra colors 120 degrees apart", () => {
		const harmony = generateColorHarmony({ h: 0, s: 100, v: 100 }, "triadic");
		expect(harmony.colors.length).toBe(3);
	});

	it("monochromatic generates 5 variations", () => {
		const harmony = generateColorHarmony({ h: 0, s: 100, v: 100 }, "monochromatic");
		expect(harmony.colors.length).toBe(5);
		expect(harmony.type).toBe("monochromatic");
	});

	it("analogous generates 5 adjacent hues", () => {
		const harmony = generateColorHarmony({ h: 0, s: 100, v: 100 }, "analogous");
		expect(harmony.colors.length).toBe(5);
	});

	it("tetradic generates 4 colors", () => {
		const harmony = generateColorHarmony({ h: 0, s: 100, v: 100 }, "tetradic");
		expect(harmony.colors.length).toBe(4);
	});

	it("split-complementary generates 3 colors", () => {
		const harmony = generateColorHarmony(
			{ h: 0, s: 100, v: 100 },
			"split-complementary",
		);
		expect(harmony.colors.length).toBe(3);
	});

	it("includes description for each type", () => {
		const types = [
			"monochromatic",
			"analogous",
			"complementary",
			"triadic",
			"tetradic",
			"split-complementary",
		] as const;
		for (const type of types) {
			expect(generateColorHarmony({ h: 0, s: 100, v: 100 }, type).description)
				.toBeTypeOf("string");
		}
	});
});

describe("generateGoldenRatioColors", () => {
	it("produces requested count of colors", () => {
		expect(generateGoldenRatioColors(0, 5)).toHaveLength(5);
	});

	it("uses hues derived from golden ratio and base hue", () => {
		const colors = generateGoldenRatioColors(0, 3);
		expect(colors[0]?.hsv.h).toBeCloseTo(0, 0);
		expect(colors[1]?.hsv.h).toBeGreaterThan(0);
	});
});

describe("generatePerceptuallyUniformColors", () => {
	it("produces requested count of colors", () => {
		expect(generatePerceptuallyUniformColors(4)).toHaveLength(4);
	});

	it("fills LAB values for each color", () => {
		const colors = generatePerceptuallyUniformColors(3);
		for (const color of colors) {
			expect(color.lab).toBeDefined();
		}
	});
});

describe("sortColorsByHue / Lightness / Saturation", () => {
	const sample = [
		{
			hex: "#00ff00",
			rgb: { r: 0, g: 255, b: 0 },
			hsv: { h: 120, s: 100, v: 100 },
			hsl: { h: 120, s: 100, l: 50 },
		},
		{
			hex: "#ff0000",
			rgb: { r: 255, g: 0, b: 0 },
			hsv: { h: 0, s: 100, v: 100 },
			hsl: { h: 0, s: 100, l: 50 },
		},
		{
			hex: "#0000ff",
			rgb: { r: 0, g: 0, b: 255 },
			hsv: { h: 240, s: 100, v: 100 },
			hsl: { h: 240, s: 100, l: 50 },
		},
	];

	it("sorts by hue ascending", () => {
		const sorted = sortColorsByHue(sample);
		expect(sorted.map((c) => c.hsv.h)).toEqual([0, 120, 240]);
	});

	it("sorts by lightness ascending", () => {
		const sorted = sortColorsByLightness(sample);
		expect(sorted.map((c) => c.hsl.l)).toEqual([50, 50, 50]);
	});

	it("sorts by saturation ascending", () => {
		const sorted = sortColorsBySaturation(sample);
		expect(sorted.map((c) => c.hsv.s)).toEqual([100, 100, 100]);
	});

	it("returns a new array without mutating input", () => {
		const original = [...sample];
		sortColorsByHue(sample);
		expect(sample).toEqual(original);
	});
});
