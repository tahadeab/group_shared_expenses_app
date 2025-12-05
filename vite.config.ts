import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed on taha.convex.dev.
    // Feel free to remove this code if you're no longer developing your app with chef.
    mode === "development"
      ? {
          name: "inject-taha-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

        `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
    // End of code for taking screenshots on taha.convex.dev.
    // End of code for taking screenshots on taha.convex.dev.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
