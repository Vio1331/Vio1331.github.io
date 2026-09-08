import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAlbum, compileFile, AlbumError } from '../parser.mjs';

test('existing module families and left/right variants map to the existing renderer', () => {
  const cases = [
    ['单图', '![](1.jpg)', { type: 'image', src: '1.jpg' }],
    ['双联', '![](1.jpg)\n![](2.jpg)', { type: 'diptych', images: 2 }],
    ['三联', '![](1.jpg)\n![](2.jpg)\n![](3.jpg)', { type: 'triptych', images: 3 }],
    ['左大右小', '![](1.jpg)\n![](2.jpg)', { type: 'asymmetric', main: 'left', images: 2 }],
    ['左小右大', '![](1.jpg)\n![](2.jpg)', { type: 'asymmetric', main: 'right', images: 2 }],
    ['短图文', '![](1.jpg)\n\n示例文字', { type: 'image_text', variant: 'short' }],
    ['短图文 左文', '![](1.jpg)\n\n示例文字', { type: 'image_text', variant: 'short', image_side: 'right' }],
    ['长图文 右文', '![](1.jpg)\n\n示例文字', { type: 'image_text', variant: 'long', image_side: 'left' }],
    ['长图文 左文', '![](1.jpg)\n\n示例文字', { type: 'image_text', variant: 'long', image_side: 'right' }],
    ['文字', '示例文字', { type: 'text', align: 'center' }],
    ['左文', '示例文字', { type: 'text', align: 'left' }],
    ['右文', '示例文字', { type: 'text', align: 'right' }]
  ];
  for (const [name, body, expected] of cases) {
    const [block] = parseAlbum(`::: ${name}\n${body}\n:::\n`);
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(key === 'images' ? block.images.length : block[key], value, name);
  }
});

test('image order, individual captions, group captions, title and optional ratio survive', () => {
  const [pair] = parseAlbum('::: 双联 铺展 手机并排\n![示例 **说明**](<照片 01.jpg> "示例标题")\n图注：第一张说明\n比例：3:2\n![](02.jpg)\n图注: 第二张说明\n组注：整组说明\n:::');
  assert.deepEqual(pair, { type: 'diptych', density: 'full', mobile: 'pair', caption: '整组说明', images: [
    { src: '%E7%85%A7%E7%89%87%2001.jpg', alt: '示例 说明', title: '示例标题', caption: '第一张说明', ratio: '3:2' },
    { src: '02.jpg', alt: '', caption: '第二张说明' }
  ] });
});

test('adjacent images stay independent; paragraphs and captions do not silently regroup', () => {
  const blocks = parseAlbum('![](1.jpg)\n![](2.jpg)\n图注：说明\n\n## 示例标题\n\n正文 **加粗**。\n\n> 示例引用\n\n![](3.jpg)');
  assert.deepEqual(blocks.map(block => block.type), ['image', 'image', 'text', 'image']);
  assert.equal(blocks[1].caption, '说明');
  assert.equal(blocks[2].text, '## 示例标题\n\n正文 **加粗**。\n\n> 示例引用');
});

test('text columns preserve paragraphs, headings, quotes and code containing delimiters', () => {
  const [block] = parseAlbum('::: 双栏文字 疏朗\n## 左栏\n\n第一段\n\n第二段\n\n+++\n\n## 右栏\n\n> 引用\n\n```text\n::: 双联\n+++\n图注：示例\n```\n:::');
  assert.equal(block.columns.length, 2);
  assert.equal(block.columns[0].text, '## 左栏\n\n第一段\n\n第二段');
  assert.match(block.columns[1].text, /```text\n::: 双联\n\+\+\+\n图注：示例\n```/);
});

test('ordinary Markdown code, escaped labels, lists and blockquotes stay ordinary Markdown', () => {
  const input = '```text\n::: 双联\n![](x.jpg)\n```\n\n\\图注：这是正文\n\n- ![](inline.jpg)\n\n> 图注：这是引用';
  assert.deepEqual(parseAlbum(input), [{ type: 'text', text: input }]);
});

test('reference images and parentheses use the Markdown parser', () => {
  const result = parseAlbum('![示例][photo]\n\n[photo]: a(b).jpg "标题"');
  assert.equal(result[0].src, 'a(b).jpg');
  assert.equal(result[0].title, '标题');
});

test('reference links remain available in separately rendered text columns; comments do not make blank modules', () => {
  const blocks = parseAlbum('<!-- 编辑备注 -->\n\n::: 双栏文字\n[链接][ref]\n\n+++\n\n第二栏 [链接][ref]\n:::\n\n[ref]: https://example.com "示例"');
  assert.equal(blocks.length, 1);
  for (const column of blocks[0].columns) assert.match(column.text, /\[REF\]: <https:\/\/example.com> "示例"/);
});

test('invalid markup fails with useful source locations instead of discarding content', () => {
  const errors = [
    ['::: 双联\n![](1.jpg)\n:::', '需要 2 张'],
    ['::: 三联\n![](1.jpg)\n![](2.jpg)\n:::', '需要 3 张'],
    ['::: 双联\n![](1.jpg)', '缺少'],
    ['::: 未知\n:::', '未知模块'],
    ['::: 长图文 左文 右文\n![](1.jpg)\n\n正文\n:::', '相反选项'],
    ['::: 单图 手机并排\n![](1.jpg)\n:::', '不支持'],
    ['图注：没有照片', '紧跟'],
    ['![](1.jpg)\n\n正文\n图注：错误位置', '紧跟'],
    ['::: 双联\n![](1.jpg)\n![](2.jpg)\n\n无标记说明\n:::', '图注'],
    ['::: 双栏文字\n左栏\n:::', '+++'],
    ['::: 文字\n::: 双联\n:::\n:::', '不能嵌套'],
    ['![说明](javascript:alert(1))', '未识别'],
    ['![](1.jpg)\n比例：0:2', '大于零']
  ];
  for (const [source, message] of errors) assert.throws(() => parseAlbum(source, { file: 'sample.md', offset: 8 }), error => error instanceof AlbumError && error.line >= 9 && error.message.includes(message), source);
});

test('front matter is preserved semantically; output feeds the existing YAML modules', () => {
  const input = '---\ntitle: 示例\ndate: 2026-09-07\nimage_base: /assets/images/example/\ncover: 1.jpg\nopening:\n  src: 0.jpg\n---\n![](1.jpg)\n图注：说明';
  const result = compileFile(input, 'example.md');
  const data = JSON.parse(result.output.split('---')[1]);
  assert.equal(data.image_base, '/assets/images/example/');
  assert.equal(data.date, '2026-09-07');
  assert.equal(data.opening.src, '0.jpg');
  assert.equal(data.blocks[0].caption, '说明');
  assert.equal(compileFile(result.output).output, result.output);
});

test('legacy files stay byte-identical and new syntax does not mix with YAML blocks', () => {
  const legacy = '---\r\ntitle: 示例\r\nblocks:\r\n  - type: image\r\n    src: 1.jpg\r\n---\r\n正文';
  assert.equal(compileFile(legacy).output, legacy);
  assert.throws(() => compileFile(legacy + '\n::: 左文\n正文\n:::'), /不能同时/);
  const broken = '---\ntitle: 示例\nblocks:\n  - type: image\n    src:.jpg\n---\n';
  assert.equal(compileFile(broken).output, broken);
  assert.match(compileFile(broken).warning, /旧 YAML/);
});
