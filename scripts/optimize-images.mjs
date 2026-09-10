import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

// Build-time only. Content-addressed URLs are safe with the existing immutable cache.
export function imageOptimizer(output) {
  const cache = new Map();
  async function variants(path) {
    const normalized = path.split("?")[0].replace(/^\//, "");
    if (!/^assets\/.*\.(png|jpe?g)$/i.test(normalized)) return null;
    if (!cache.has(normalized)) cache.set(normalized, (async () => {
      const input = await readFile(join(output, normalized));
      const metadata = await sharp(input).metadata();
      const hash = createHash("sha256").update(input).update("webp-v1-q82").digest("hex").slice(0, 12);
      const stem = basename(normalized).replace(/\.[^.]+$/, "");
      const widths = [...new Set([480, 960, 1440, Math.min(2560, metadata.width)].filter((w) => w <= metadata.width))].sort((a,b) => a-b);
      if (!widths.length) widths.push(metadata.width);
      const sources = [];
      for (const width of widths) {
        const file = `/assets/optimized/${stem}-${hash}-${width}.webp`;
        const buffer = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
        const outputPath = join(output, file.slice(1));
        await mkdir(dirname(outputPath), { recursive: true });
        try {
          await writeFile(outputPath, buffer);
        } catch (err) {
          if (err.code === "ENOENT") {
            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, buffer);
          } else {
            throw err;
          }
        }
        sources.push({ width, file, bytes: buffer.length });
      }
      return { width: metadata.width, height: metadata.height, sources, originalBytes: input.length };
    })());
    return cache.get(normalized);
  }
  async function html(markup) {
    const tags = [...new Set(markup.match(/<img\b[^>]*>/g) || [])];
    for (const tag of tags) {
      const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
      if (!src) continue;
      const data = await variants(src);
      if (!data) continue;
      let fallback = tag;
      if (!/\swidth=/.test(fallback)) fallback = fallback.replace("<img", `<img width="${data.width}" height="${data.height}"`);
      const sizes = tag.includes("card.jpg") ? "(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 360px" : "(max-width: 600px) 100vw, (max-width: 1000px) 90vw, 1100px";
      const srcset = data.sources.map(({file,width}) => `${file} ${width}w`).join(", ");
      markup = markup.replaceAll(tag, `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}">${fallback}</picture>`);
    }
    return markup;
  }
  async function css(styles) {
    for (const match of [...styles.matchAll(/url\(["']?(\/?assets\/[^)"']+\.(?:png|jpe?g))["']?\)/g)]) {
      const data = await variants(match[1]);
      if (data) styles = styles.replaceAll(match[0], `image-set(url("${(data.sources.find((item) => item.width >= 960) || data.sources.at(-1)).file}") 1x, url("${data.sources.at(-1).file}") 2x)`);
    }
    return styles;
  }
  async function report() {
    return Object.fromEntries(await Promise.all([...cache].map(async ([path,data]) => [path,await data])));
  }
  return { html, css, report };
}
