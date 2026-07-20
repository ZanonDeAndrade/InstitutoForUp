import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  root: "admin",
  server: {
    host: "::",
    port: 8081,
  },
  preview: {
    host: "::",
    port: 4174,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./lading/src"),
    },
  },
  build: {
    outDir: "../dist-admin",
    emptyOutDir: true,
  },
}));
