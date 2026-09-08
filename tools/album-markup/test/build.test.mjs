import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
test('build copy compiles new files, preserves legacy and article source, and can be regenerated', async () => {
  const source = await fs.mkdtemp(path.join(os.tmpdir(), 'optics-markup-test-'));
  try {
    await fs.mkdir(path.join(source, '_photography'));
    await fs.mkdir(path.join(source, '_posts'));
    const album = '---\ntitle: 示例\nimage_base: /assets/images/\ncover: 01.jpg\n---\n::: 双联\n![](01.jpg)\n![](02.jpg)\n:::\n';
    const legacy = '---\ntitle: 示例\nblocks:\n  - type: image\n    src: 01.jpg\n---\n';
    const article = '---\ntitle: 示例文章\n---\n::: 这不是摄影集语法\n';
    await fs.writeFile(path.join(source, '_photography/new.md'), album);
    await fs.writeFile(path.join(source, '_photography/legacy.md'), legacy);
    await fs.writeFile(path.join(source, '_posts/article.md'), article);
    for (let i = 0; i < 2; i++) execFileSync(process.execPath, [cli, 'prepare', '--source', source]);
    assert.equal(await fs.readFile(path.join(source, '_photography/new.md'), 'utf8'), album);
    assert.equal(await fs.readFile(path.join(source, '_album_build/_photography/legacy.md'), 'utf8'), legacy);
    assert.equal(await fs.readFile(path.join(source, '_album_build/_posts/article.md'), 'utf8'), article);
    const generated = await fs.readFile(path.join(source, '_album_build/_photography/new.md'), 'utf8');
    assert.match(generated, /"type": "diptych"/);
    assert.doesNotMatch(generated, /::: 双联/);
    await fs.mkdir(path.join(source, 'my-files'));
    await fs.writeFile(path.join(source, 'my-files/keep.txt'), 'keep');
    assert.throws(() => execFileSync(process.execPath, [cli, 'prepare', '--source', source, '--output', path.join(source, 'my-files')], { stdio: 'pipe' }), /不是本工具生成/);
    assert.equal(await fs.readFile(path.join(source, 'my-files/keep.txt'), 'utf8'), 'keep');
  } finally { await fs.rm(source, { recursive: true, force: true }); }
});
