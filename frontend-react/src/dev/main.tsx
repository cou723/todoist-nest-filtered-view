/**
 * Development entry point for UI screenshots
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DevApp } from "./DevApp";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<DevApp />
	</StrictMode>,
);
