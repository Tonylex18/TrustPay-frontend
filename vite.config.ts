import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
// import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig (({ mode }) => ({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
    outDir: "build",
    target: ["es2017"], 
    cssTarget: "safari13",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    tsconfigPaths(),
    react(),
    mode === "development" ? require("@dhiwise/component-tagger").default() : null,
  ].filter(Boolean),
  server: {
    port: 4028,
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new']
  }
}));