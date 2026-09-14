import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const productsDir = path.join(root, 'products');
const publicDir = path.join(root, 'public');

await mkdir(path.join(publicDir, 'assets'), { recursive: true });
await mkdir(path.join(publicDir, 'covers'), { recursive: true });
await mkdir(path.join(publicDir, 'preview'), { recursive: true });

const slugs = (await readdir(productsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const report = [];
const media = { covers: {}, previews: {} };

for (const slug of slugs) {
  const folder = path.join(productsDir, slug);
  const zipSrc = path.join(folder, 'buyer.zip');
  const zipStat = await stat(zipSrc).catch(() => null);
  if (!zipStat?.isFile() || zipStat.size < 100) {
    throw new Error(`Missing or empty buyer.zip for ${slug}`);
  }
  const bytes = readFileSync(zipSrc);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error(`${slug} buyer.zip is not a ZIP`);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  await copyFile(zipSrc, path.join(publicDir, 'assets', `${slug}.zip`));

  const coverPng = path.join(folder, 'cover.png');
  const coverJpg = path.join(folder, 'cover.jpg');
  const coverSrc = (await stat(coverPng).then((info) => info.isFile()).catch(() => false))
    ? coverPng
    : (await stat(coverJpg).then((info) => info.isFile()).catch(() => false) ? coverJpg : null);
  if (coverSrc) {
    const ext = path.extname(coverSrc);
    await copyFile(coverSrc, path.join(publicDir, 'covers', `${slug}${ext}`));
    media.covers[slug] = `/covers/${slug}${ext}`;
  }

  const previewSrc = path.join(folder, 'preview');
  const previewEntries = await readdir(previewSrc).catch(() => []);
  await mkdir(path.join(publicDir, 'preview', slug), { recursive: true });
  const copiedPreview = [];
  for (const name of previewEntries) {
    if (name.startsWith('.')) continue;
    const from = path.join(previewSrc, name);
    if (!(await stat(from)).isFile()) continue;
    await copyFile(from, path.join(publicDir, 'preview', slug, name));
    copiedPreview.push(`/preview/${slug}/${name}`);
    media.previews[`${slug}/${name}`] = true;
  }

  report.push({ slug, bytes: zipStat.size, sha256, preview: copiedPreview, cover: Boolean(coverSrc) });
}

await writeFile(
  path.join(root, 'src/media.js'),
  `// Updated by scripts/prepare-assets.mjs before each deployment.\nexport const media = ${JSON.stringify(media)};\n`,
);
console.log(JSON.stringify({ skus: report }, null, 2));
