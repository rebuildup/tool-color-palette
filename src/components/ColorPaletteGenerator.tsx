"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ColorInfo } from "../lib/color";
import { AppFrame } from "./AppFrame";
import { ColorPaletteControls } from "./ColorPaletteControls";
import {
	type ColorRangePresetName,
	colorRangePresets,
	defaultSettings,
} from "./color-palette-constants";
import type { ColorPaletteSettings, SavedPalette } from "./color-palette-types";
import { generatePaletteColors } from "./color-palette-utils";
import { GeneratedPalette } from "./GeneratedPalette";
import { PaletteActions } from "./PaletteActions";
import { PaletteExport } from "./PaletteExport";
import { SavedPalettes } from "./SavedPalettes";

export default function ColorPaletteGenerator() {
	const [settings, setSettings] =
		useState<ColorPaletteSettings>(defaultSettings);
	const [generatedColors, setGeneratedColors] = useState<ColorInfo[]>([]);
	const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
	const [notification, setNotification] = useState("");

	const paletteIdRef = useRef(1);

	const showNotification = useCallback((message: string) => {
		setNotification(message);
		setTimeout(() => setNotification(""), 3000);
	}, []);

	const savePalette = useCallback(
		async (customName?: string) => {
			if (generatedColors.length === 0) {
				return;
			}

			const name = customName || `Palette ${savedPalettes.length + 1}`;
			const newPalette: SavedPalette = {
				id: `palette-${paletteIdRef.current++}`,
				name,
				colors: generatedColors,
				createdAt: new Date().toISOString(),
				tags: [settings.generationAlgorithm],
			};

			setSavedPalettes((prev) => [newPalette, ...prev]);
			showNotification(`パレット "${name}" を保存しました`);
		},
		[
			generatedColors,
			savedPalettes.length,
			settings.generationAlgorithm,
			showNotification,
		],
	);

	const generateColors = useCallback(async () => {
		const colors = generatePaletteColors(settings);

		setGeneratedColors(colors);
		if (settings.autoSave && colors.length > 0) {
			await savePalette(`Auto-saved ${new Date().toLocaleTimeString()}`);
		}
		showNotification(`${colors.length}色のパレットを生成しました`);
	}, [settings, savePalette, showNotification]);

	const applyPreset = (preset: ColorRangePresetName) => {
		const range = colorRangePresets[preset];
		setSettings((prev) => ({
			...prev,
			hueRange: { min: range.hMin, max: range.hMax },
			saturationRange: { min: range.sMin, max: range.sMax },
			valueRange: { min: range.vMin, max: range.vMax },
		}));
		showNotification(`${preset}プリセットを適用しました`);
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			showNotification("コピーしました");
			return;
		} catch {
			// Fall through to the deprecated API: inside an opaque-origin
			// sandbox frame the async Clipboard API is unavailable.
		}

		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		let copied = false;
		try {
			copied = document.execCommand("copy");
		} catch {
			copied = false;
		}
		textarea.remove();
		showNotification(copied ? "コピーしました" : "コピー失敗");
	};

	useEffect(() => {
		// A sandboxed iframe without `allow-same-origin` has an opaque origin,
		// where touching `localStorage` throws. Saved palettes are a
		// convenience, so the app keeps working with in-memory state instead.
		try {
			const saved = localStorage.getItem("color-palettes-v2");
			if (saved) {
				try {
					setSavedPalettes(JSON.parse(saved));
				} catch (error) {
					console.error(error);
				}
			}
		} catch {
			// Storage is unavailable (opaque origin or blocked cookies).
		}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem("color-palettes-v2", JSON.stringify(savedPalettes));
		} catch {
			// Storage is unavailable (opaque origin or blocked cookies).
		}
	}, [savedPalettes]);

	return (
		<AppFrame title="Color Palette Generator">
			<div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
				<div
					style={{
						flex: "1 1 360px",
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					}}
				>
					<ColorPaletteControls
						settings={settings}
						setSettings={setSettings}
						onApplyPreset={applyPreset}
					/>
					<SavedPalettes
						savedPalettes={savedPalettes}
						onLoad={(colors) => setGeneratedColors(colors)}
						onDelete={(id) =>
							setSavedPalettes((prev) =>
								prev.filter((saved) => saved.id !== id),
							)
						}
					/>
				</div>

				<div
					style={{
						flex: "1 1 360px",
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					}}
				>
					<PaletteActions
						onGenerate={generateColors}
						onSave={() => savePalette()}
					/>
					<GeneratedPalette
						generatedColors={generatedColors}
						notification={notification}
						onCopy={copyToClipboard}
					/>
					<PaletteExport
						settings={settings}
						generatedColors={generatedColors}
						setSettings={setSettings}
						onCopy={copyToClipboard}
					/>
				</div>
			</div>
		</AppFrame>
	);
}
