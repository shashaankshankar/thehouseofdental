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
      const hash = createHash("sha256").update(input).update("webp-v2-q80").digest("hex").slice(0, 12);
      const stem = basename(normalized).replace(/\.[^.]+$/, "");
      const widths = [...new Set([480, 720, 960, 1440, Math.min(2560, metadata.width)].filter((w) => w <= metadata.width))].sort((a,b) => a-b);
      if (!widths.length) widths.push(metadata.width);
      const sources = [];
      for (const width of widths) {
        const file = `/assets/optimized/${stem}-${hash}-${width}.webp`;
        const buffer = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
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
      // data-responsive marks an author-managed <picture>; the generated variants top out at
      // 1440px, which is too small for full-bleed images on large screens.
      if (/\sdata-responsive\b/.test(tag)) { markup = markup.replaceAll(tag, tag.replace(/\sdata-responsive\b/, "")); continue; }
      const data = await variants(src);
      if (!data) continue;
      let fallback = tag;
      if (!/\swidth=/.test(fallback)) fallback = fallback.replace("<img", `<img width="${data.width}" height="${data.height}"`);
      const existingSizes = tag.match(/\ssizes="([^"]+)"/)?.[1];
      const isCard = tag.includes("card") || tag.includes("service-") || tag.includes("hydroderm-") || tag.includes("ba-");
      const isDoctorCutout = src.includes("dr-patel-home-cutout");
      const sizes = existingSizes || (
        isDoctorCutout ? "(max-width: 900px) 90vw, 520px" :
        isCard ? "(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 390px" :
        "(max-width: 600px) 100vw, (max-width: 1000px) 90vw, 1100px"
      );
      const srcset = data.sources.map(({file,width}) => `${file} ${width}w`).join(", ");
      markup = markup.replaceAll(tag, `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}">${fallback}</picture>`);
    }
    return markup;
  }
  async function css(styles) {
    for (const match of [...styles.matchAll(/url\(["']?(\/?assets\/[^)"']+\.(?:png|jpe?g))["']?\)/g)]) {
      const data = await variants(match[1]);
      if (data) {
        const x1 = (data.sources.find((item) => item.width >= 720) || data.sources[0]).file;
        const x2 = (data.sources.find((item) => item.width >= 960 && item.width <= 1440) || data.sources.at(-1)).file;
        styles = styles.replaceAll(match[0], `image-set(url("${x1}") 1x, url("${x2}") 2x)`);
      }
    }
    return styles;
  }
  async function report() {
    return Object.fromEntries(await Promise.all([...cache].map(async ([path,data]) => [path,await data])));
  }
  return { html, css, report };
}
