import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ColorPaletteApp from "./ColorPaletteApp";

const container = document.getElementById("root");

if (!container) {
	throw new Error("Color Palette: missing #root element");
}

createRoot(container).render(
	<StrictMode>
		<ColorPaletteApp />
	</StrictMode>,
);
