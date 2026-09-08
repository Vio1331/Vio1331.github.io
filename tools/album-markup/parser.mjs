import MarkdownIt from 'markdown-it';
import { parseDocument } from 'yaml';

// These names are the authoring API. Photo shape stays in the existing renderer.
export const modules = Object.freeze({
  '单图': { type: 'image', count: 1 },
  '双联': { type: 'diptych', count: 2 },
  '三联': { type: 'triptych', count: 3 },
  '左大右小': { type: 'asymmetric', count: 2, main: 'left' },
  '左小右大': { type: 'asymmetric', count: 2, main: 'right' },
  '短图文': { type: 'image_text', count: 1, variant: 'short' },
  '长图文': { type: 'image_text', count: 1, variant: 'long' },
  '文字': { type: 'text', align: 'center' },
  '左文': { type: 'text', align: 'left' },
  '右文': { type: 'text', align: 'right' },
  '双栏文字': { type: 'text', columns: true }
});

export class AlbumError extends Error {
  constructor(message, file, line) {
    super(`${file}:${line}: ${message}`);
    this.name = 'AlbumError';
    this.file = file;
    this.line = line;
  }
}

const fail = (env, line, message) => {
  throw new AlbumError(message, env.file, env.offset + line + 1);
};
const markdown = new MarkdownIt({ html: true });
markdown.block.ruler.before('fence', 'album_module', (state, start, end, silent) => {
  if (state.sCount[start] - state.blkIndent >= 4) return false;
  const lineAt = line => state.src.slice(state.bMarks[line], state.eMarks[line]);
  const startMatch = /^ {0,3}:::(.*)$/.exec(lineAt(start));
  if (!startMatch) return false;
  if (silent) return true;
  if (!startMatch[1].trim()) fail(state.env, start, '多出了结束标记 :::。');
  let codeFence = null;
  let last = start + 1;
  for (; last < end; last++) {
    const line = lineAt(last);
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (codeFence) {
      if (fence && fence[1][0] === codeFence[0] && fence[1].length >= codeFence.length && !fence[2].trim()) codeFence = null;
      continue;
    }
    if (fence) { codeFence = fence[1]; continue; }
    if (/^ {0,3}:::\s*$/.test(line)) break;
    if (/^ {0,3}:::/.test(line)) fail(state.env, last, '模块不能嵌套；请先用 ::: 结束上一组。');
  }
  if (last === end) fail(state.env, start, '这个模块缺少单独一行的结束标记 :::。');
  const token = state.push('album_module', '', 0);
  token.info = startMatch[1].trim();
  token.content = state.src.slice(state.bMarks[start + 1], state.bMarks[last]);
  token.map = [start, last + 1];
  state.line = last + 1;
  return true;
}, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });

function picture(line, env, index) {
  const children = markdown.parseInline(line.trim(), env)[0].children;
  if (children.length !== 1 || children[0].type !== 'image') return null;
  const token = children[0];
  const src = token.attrGet('src');
  if (!src || src.includes('\\') || (/^[a-z][a-z\d+.-]*:/i.test(src) && !/^https?:\/\//i.test(src))) {
    fail(env, index, '图片请填写文件名、站内路径或 https/http 地址。');
  }
  const result = { src, alt: markdown.renderer.renderInlineAsText(token.children, {}, env) };
  const title = token.attrGet('title');
  if (title) result.title = title;
  return result;
}

function units(source, env) {
  const lines = source.split('\n');
  const tokens = markdown.parse(source, env);
  const result = [];
  for (const token of tokens) {
    if (token.level !== 0 || !token.map || token.nesting === -1) continue;
    const [start, end] = token.map;
    if (token.type === 'html_block' && /^(?:\s*<!--[\s\S]*?-->\s*)+$/.test(token.content)) continue;
    if (token.type === 'album_module') {
      result.push({ kind: 'module', token, start, end });
    } else if (token.type === 'paragraph_open') {
      // Only whole, top-level lines are syntax; quotes/lists/code remain Markdown.
      let textStart = null;
      const flush = at => {
        if (textStart !== null) result.push({ kind: 'text', start: textStart, end: at });
        textStart = null;
      };
      for (let i = start; i < end; i++) {
        const line = lines[i].trim();
        const photo = picture(line, env, i);
        const label = /^(图注|组注|比例)[：:]\s*(.*)$/.exec(line);
        const separator = line === '+++';
        if (photo || label || separator) {
          flush(i);
          result.push({ kind: photo ? 'image' : separator ? 'column' : label[1], photo, value: label?.[2], start: i, end: i + 1 });
        } else {
          if (line.startsWith('![')) fail(env, i, '图片标记未识别；请每行写一张 ![说明](文件名)，检查括号和路径。');
          if (textStart === null) textStart = i;
        }
      }
      flush(end);
    } else result.push({ kind: 'text', start, end });
  }
  return result.map(unit => ({ ...unit, raw: lines.slice(unit.start, unit.end).join('\n') }));
}

function textOf(items, source) {
  if (!items.length) return '';
  const lines = source.split('\n');
  const runs = [];
  for (const item of items) {
    const previous = runs.at(-1);
    if (previous && lines.slice(previous.end, item.start).every(line => !line.trim())) previous.end = item.end;
    else runs.push({ start: item.start, end: item.end });
  }
  return runs.map(run => lines.slice(run.start, run.end).join('\n')).join('\n\n').trim();
}

function imageDetail(item, target, env) {
  if (!target) fail(env, item.start, `${item.kind}需要紧跟一张照片，不能放在正文后面。`);
  if (!item.value) fail(env, item.start, `${item.kind}不能为空；不需要时删除这一行。`);
  const key = item.kind === '比例' ? 'ratio' : 'caption';
  if (target[key]) fail(env, item.start, `同一张照片重复填写了${item.kind}。`);
  if (key === 'ratio' && !/^\d+(?:\.\d+)?\s*[:/]\s*\d+(?:\.\d+)?$/.test(item.value)) fail(env, item.start, '比例请写成 3:2、2:3 或 1:1。');
  if (key === 'ratio' && item.value.split(/[:/]/).some(part => Number(part) <= 0)) fail(env, item.start, '比例的两个数字都必须大于零。');
  target[key] = item.value;
}

function parseModule(unit, env) {
  const [name, ...options] = unit.token.info.split(/\s+/);
  const spec = modules[name];
  if (!spec) fail(env, unit.start, `未知模块“${name}”。可用：${Object.keys(modules).join('、')}。`);
  const block = { type: spec.type };
  for (const key of ['main', 'align', 'variant']) if (spec[key]) block[key] = spec[key];
  const seen = new Set();
  for (const option of options) {
    let field, value;
    if (['疏朗', '铺展'].includes(option)) { field = 'density'; value = option === '疏朗' ? 'airy' : 'full'; }
    else if (['左文', '右文'].includes(option) && spec.type === 'image_text') { field = 'image_side'; value = option === '左文' ? 'right' : 'left'; }
    else if (['手机并排', '手机堆叠'].includes(option) && spec.type === 'diptych') { field = 'mobile'; value = option === '手机并排' ? 'pair' : 'stack'; }
    else fail(env, unit.start, `“${name}”不支持选项“${option}”。`);
    if (seen.has(field)) fail(env, unit.start, '同一模块不能重复指定或同时使用相反选项。');
    seen.add(field);
    block[field] = value;
  }
  const innerEnv = { ...env, offset: env.offset + unit.start + 1 };
  const source = unit.token.content;
  const contents = units(source, innerEnv);
  const images = [];
  const texts = [[], []];
  let column = 0;
  let latestImage = null;
  for (const item of contents) {
    if (item.kind === 'image') {
      if (spec.type === 'text') fail(innerEnv, item.start, '纯文字模块不能放独立照片，请使用长图文或短图文。');
      images.push(item.photo);
      latestImage = item.photo;
    } else if (['图注', '比例'].includes(item.kind)) imageDetail(item, latestImage, innerEnv);
    else if (item.kind === '组注') {
      if (!['diptych', 'triptych'].includes(spec.type)) fail(innerEnv, item.start, '组注只用于双联、三联；其他模块请在照片后写图注。');
      if (block.caption || !item.value) fail(innerEnv, item.start, '组注请填写一次，且不能为空。');
      block.caption = item.value;
      latestImage = null;
    } else if (item.kind === 'column') {
      if (!spec.columns || column) fail(innerEnv, item.start, '+++ 只在双栏文字中使用一次，分开左栏和右栏。');
      column = 1;
      latestImage = null;
    } else {
      if (item.kind === 'module') fail(innerEnv, item.start, '模块不能嵌套。');
      texts[column].push(item);
      latestImage = null;
    }
  }
  if (spec.count && images.length !== spec.count) fail(env, unit.start, `“${name}”需要 ${spec.count} 张照片，目前有 ${images.length} 张。`);
  const copy = texts.map(items => textOf(items, source));
  if (spec.type === 'text' || spec.type === 'image_text') {
    if (spec.columns) {
      if (column !== 1 || copy.some(text => !text)) fail(env, unit.start, '双栏文字需要用单独一行 +++ 分成两个非空文字栏。');
      block.columns = copy.map(text => ({ text }));
    } else {
      if (!copy[0]) fail(env, unit.start, `“${name}”需要正文。`);
      block.text = copy[0];
    }
  } else if (copy.some(Boolean)) fail(env, unit.start, `“${name}”内的说明请用“图注：”${['diptych', 'triptych'].includes(spec.type) ? '或“组注：”' : ''}；正文写到模块外。`);
  if (['image', 'image_text'].includes(spec.type)) Object.assign(block, images[0]);
  else if (spec.count) block.images = images;
  return block;
}

export function parseAlbum(source, { file = '摄影集.md', offset = 0 } = {}) {
  const env = { file, offset };
  const contents = units(source, env);
  const blocks = [];
  let textItems = [];
  let latestImage = null;
  const flushText = () => {
    if (textItems.length) blocks.push({ type: 'text', text: textOf(textItems, source) });
    textItems = [];
  };
  for (const item of contents) {
    if (item.kind === 'module') {
      flushText();
      blocks.push(parseModule(item, env));
      latestImage = null;
    } else if (item.kind === 'image') {
      flushText();
      latestImage = { type: 'image', ...item.photo };
      blocks.push(latestImage);
    } else if (['图注', '比例'].includes(item.kind)) imageDetail(item, latestImage, env);
    else if (item.kind === '组注') fail(env, item.start, '组注应写在双联或三联的 ::: 标记内。');
    else {
      textItems.push(item);
      latestImage = null;
    }
  }
  flushText();
  // References may be defined anywhere in the album, while each text module is
  // rendered separately by Jekyll. Carry definitions into every text fragment.
  const references = Object.entries(env.references || {}).map(([label, ref]) => `[${label}]: <${ref.href}>${ref.title ? ' ' + JSON.stringify(ref.title) : ''}`).join('\n');
  if (references) for (const block of blocks) {
    if (block.text) block.text += '\n\n' + references;
    for (const column of block.columns || []) column.text += '\n\n' + references;
  }
  return blocks;
}

export function compileFile(input, file = '摄影集.md') {
  const source = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(source);
  if (!match) throw new AlbumError('摄影集开头需要一对 ---，中间填写标题等信息。', file, 1);
  const header = match[1];
  const body = source.slice(match[0].length);
  const offset = match[0].split('\n').length - 1;
  // Legacy documents remain byte-for-byte identical, including their trailing Markdown.
  // Do not make an unrelated legacy YAML typo block deployment of every new album.
  if (/^blocks\s*:/m.test(header)) {
    const parsed = parseDocument(header);
    const warning = parsed.errors.length ? `${file}: 旧 YAML 存在语法问题，已原样保留：${parsed.errors[0].message.split('\n')[0]}` : null;
    if (!parsed.errors.length && units(body, { file, offset }).some(item => item.kind === 'module')) throw new AlbumError('同一摄影集不能同时使用 YAML blocks 和正文模块标记。', file, offset + 1);
    return { output: input, changed: false, legacy: true, warning };
  }
  const parsed = parseDocument(header);
  if (parsed.errors.length) throw new AlbumError(`文件开头格式有误：${parsed.errors[0].message.split('\n')[0]}`, file, (parsed.errors[0].linePos?.[0]?.line || 1) + 1);
  const data = parsed.toJS();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new AlbumError('文件开头必须是 title: 等键值信息。', file, 2);
  const blocks = parseAlbum(body, { file, offset });
  if (!blocks.length) return { output: input, changed: false, legacy: false };
  // JSON is valid YAML. This is emitted into the disposable build directory only.
  data.blocks = blocks;
  return { output: `---\n${JSON.stringify(data, null, 2)}\n---\n`, changed: true, legacy: false, blocks };
}
