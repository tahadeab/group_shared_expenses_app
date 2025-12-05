import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
	<App />
  </ConvexAuthProvider>,
);
window.addEventListener('message', async (event: MessageEvent<any>) => {
	// Ensure we have an event and the message is from the parent frame
	if (!event || event.source !== window.parent) return;

	const data = event.data;
	if (!data || data.type !== 'chefPreviewRequest') return;

	// Safely attempt to dynamically import the remote worker. Keep the
	// imported worker typed as `any` to avoid type errors at compile time
	// and wrap in try/catch to avoid runtime crashes if the import fails.
	let worker: any = null;
	try {
		// @ts-ignore: dynamic remote module import — types may not be available at build time
		worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
	} catch (err) {
		console.error('Failed to load remote worker module:', err);
		return;
	}

	// Minimal safe placeholder for calling worker APIs. Do not assume
	// any particular shape — check for a callable export before invoking.
	try {
		const maybeCallable = (worker && (worker.default ?? worker.handleRequest)) as any;
		if (typeof maybeCallable === 'function') {
			// Example invocation (commented out): adjust when you know the API.
			// await maybeCallable(data);
		} else {
			// No callable export found on the worker; leave as a harmless no-op.
		}
	} catch (err) {
		console.error('Error while calling worker API placeholder:', err);
	}
});
