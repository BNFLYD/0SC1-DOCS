import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import mdx from "@mdx-js/rollup";
import rehypePrettyCode from "rehype-pretty-code";

export default defineConfig({
  plugins: [
    mdx({
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            // Tema de Shiki. Alternativas: 'github-dark', 'one-light', etc.
            theme: "one-dark-pro",
            keepBackground: true,
            defaultLang: "js",
          },
        ],
      ],
    }),
    react(),
    svgr(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      'localhost',
      'cst-rv-comments-spas.trycloudflare.com', // Tu subdominio de TryCloudflare
    ],
  },
});
