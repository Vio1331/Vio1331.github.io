import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import sharp from 'sharp';

const widths = [320, 640, 960, 1440];
const quality = 82;
const outputDirectory = '/assets/images/generated/covers';
const isExternal = value => /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value);

// Match content_image_url's local path rules; external covers retain their original URL.
export function coverPath(data) {
  let source = String(data.cover || '');
  if (!source || isExternal(source)) return null;
  if (!source.startsWith('/') && data.image_base) source = String(data.image_base).replace(/\/+$/, '') + '/' + source.replace(/^\.\//, '');
  if (isExternal(source)) return null;
  source = '/' + source.replace(/^\/+/, '');
  if (source.split('/').includes('..') || !/\.(?:jpe?g|png|webp|avif|tiff?)$/i.test(source)) return null;
  return source;
}

// Only writes derivatives into the disposable build copy, never into the source tree.
export async function generateCoverImages(buildRoot) {
  const manifest = {};
  const byHash = new Map();
  const destination = path.join(buildRoot, outputDirectory);
  await fs.mkdir(destination, { recursive: true });
  const files = await fs.readdir(path.join(buildRoot, '_photography'), { recursive: true });
  for (const file of files.filter(file => /\.md$/i.test(file)).sort()) {
    const text = await fs.readFile(path.join(buildRoot, '_photography', file), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    const data = frontmatter ? parse(frontmatter[1]) || {} : {};
    const source = coverPath(data);
    if (!source || data.published === false || manifest[source]) continue;
    let input;
    try { input = await fs.readFile(path.join(buildRoot, source)); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const hash = createHash('sha256').update(input).update(`webp:${quality}:${widths}:rotate:srgb:${sharp.versions.sharp}`).digest('hex').slice(0, 20);
    if (byHash.has(hash)) { manifest[source] = byHash.get(hash); continue; }
    const metadata = await sharp(input).metadata();
    // Animated covers remain animated; they are not flattened into a thumbnail.
    if (metadata.pages > 1) continue;
    const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
    const width = rotated ? metadata.height : metadata.width;
    const height = rotated ? metadata.width : metadata.height;
    const sources = [];
    for (const size of [...new Set(widths.map(size => Math.min(size, width)))]) {
      const url = `${outputDirectory}/${hash}-${size}.webp`;
      await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).toColourspace('srgb').webp({ quality }).toFile(path.join(buildRoot, url));
      sources.push({ url, width: size });
    }
    const entry = { width, height, src: (sources.find(item => item.width >= 640) || sources.at(-1)).url, sources };
    manifest[source] = entry;
    byHash.set(hash, entry);
  }
  await fs.mkdir(path.join(buildRoot, '_data'), { recursive: true });
  await fs.writeFile(path.join(buildRoot, '_data/cover_images.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
