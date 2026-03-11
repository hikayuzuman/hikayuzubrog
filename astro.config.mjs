import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/static";
import tailwind from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  output: "static",
  adapter: vercel(),
  markdown: {
    rehypePlugins: [rehypeSlug]
  },
  vite: {
    plugins: [tailwind()]
  }
});
