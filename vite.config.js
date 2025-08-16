import path from "path";
import osciLight from "./src/themes/osci-light.json" assert { type: "json" }
import osciDark from "./src/themes/osci-dark.json" assert { type: "json" }
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
            theme: {
              light: osciLight,
              dark: osciDark,
            },
            keepBackground: false,
            defaultLang: 'js',
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
    ],
  },
});
