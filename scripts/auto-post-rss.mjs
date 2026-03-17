import fs from "node:fs/promises";
import path from "node:path";
import Parser from "rss-parser";
import { slug as slugify } from "github-slugger";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");

const RSS_URL = process.env.RSS_URL;
const MAX_ITEMS = Number.parseInt(process.env.MAX_ITEMS ?? "3", 10);

if (!RSS_URL) {
  console.error("RSS_URL is required.");
  process.exit(1);
}

const parser = new Parser();

const stripHtml = (value) =>
  value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";

const toDate = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? new Date() : parsed;
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const exists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const getExistingSlugs = async () => {
  await ensureDir(POSTS_DIR);
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  return new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));
};

const toFrontmatter = (item) => {
  const title = (item.title ?? "Untitled").trim();
  const description = stripHtml(item.contentSnippet || item.summary || item.content || "");
  const pubDate = toDate(item.isoDate || item.pubDate);
  const sourceUrl = item.link ?? "";

  return {
    title,
    description: description || "Imported from RSS feed.",
    pubDate: pubDate.toISOString().slice(0, 10),
    sourceUrl
  };
};

const formatPost = ({ title, description, pubDate, sourceUrl }) => {
  const lines = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `pubDate: ${pubDate}`,
    sourceUrl ? `sourceUrl: "${sourceUrl.replace(/"/g, '\\"')}"` : "",
    "---",
    "",
    "## Overview",
    "",
    description,
    "",
    sourceUrl ? `Source: ${sourceUrl}` : ""
  ].filter(Boolean);

  return `${lines.join("\n")}\n`;
};

const main = async () => {
  const feed = await parser.parseURL(RSS_URL);
  const existing = await getExistingSlugs();
  const items = (feed.items ?? []).slice(0, MAX_ITEMS);

  let created = 0;

  for (const item of items) {
    const title = (item.title ?? "Untitled").trim();
    const slug = slugify(title);
    if (!slug || existing.has(slug)) continue;

    const frontmatter = toFrontmatter(item);
    const postDir = path.join(POSTS_DIR, slug);
    const postPath = path.join(postDir, "index.md");

    if (await exists(postPath)) {
      existing.add(slug);
      continue;
    }

    await ensureDir(postDir);
    await fs.writeFile(postPath, formatPost(frontmatter), "utf8");
    existing.add(slug);
    created += 1;
  }

  console.log(`Created ${created} posts.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
