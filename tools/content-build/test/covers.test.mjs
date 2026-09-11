import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { coverPath, generateCoverImages } from '../cover-images.mjs';

test('cover paths follow the image base and leave remote, unsupported or unsafe sources alone', () => {
  assert.equal(coverPath({ cover: './照片.jpg', image_base: '/assets/images/旅行/' }), '/assets/images/旅行/照片.jpg');
  assert.equal(coverPath({ cover: '/assets/cover.png', image_base: '/ignored/' }), '/assets/cover.png');
  for (const data of [{ cover: 'https://example.com/a.jpg' }, { cover: 'a.jpg', image_base: 'https://example.com' }, { cover: '../a.jpg' }, { cover: 'a.svg' }, {}]) assert.equal(coverPath(data), null);
});

test('cover derivatives preserve originals, orient dimensions, cap size and deduplicate identical images', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'optics-covers-'));
  try {
    await fs.mkdir(path.join(root, '_photography'));
    await fs.mkdir(path.join(root, 'assets'));
    const original = await sharp({ create: { width: 900, height: 500, channels: 3, background: '#c96749' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    for (const name of ['one', 'two']) {
      await fs.writeFile(path.join(root, `assets/${name}.jpg`), original);
      await fs.writeFile(path.join(root, `_photography/${name}.md`), `---\ncover: ${name}.jpg\nimage_base: /assets/\n---\n`);
    }
    await fs.writeFile(path.join(root, '_photography/missing.md'), '---\ncover: /assets/missing.jpg\n---\n');
    const manifest = await generateCoverImages(root);
    const cover = manifest['/assets/one.jpg'];
    assert.deepEqual(cover, manifest['/assets/two.jpg']);
    assert.equal(manifest['/assets/missing.jpg'], undefined);
    assert.deepEqual([cover.width, cover.height], [500, 900]);
    assert.deepEqual(cover.sources.map(s => s.width), [320, 500]);
    assert.equal((await fs.readdir(path.join(root, 'assets/images/generated/covers'))).length, 2);
    for (const source of cover.sources) {
      const meta = await sharp(path.join(root, source.url)).metadata();
      assert.equal(meta.width, source.width);
      assert.equal(meta.height, Math.round(source.width * 900 / 500));
      assert.equal(meta.format, 'webp');
    }
    assert.deepEqual(await fs.readFile(path.join(root, 'assets/one.jpg')), original);
    assert.deepEqual(await generateCoverImages(root), manifest);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, '_data/cover_images.json'), 'utf8')), manifest);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
