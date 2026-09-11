import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFile, PhotographyError } from './parser.mjs';
import { generateCoverImages } from './cover-images.mjs';

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const command = args.shift() || 'check';
let root = defaultRoot;
let output;
let examples = false;
while (args.length) {
  const flag = args.shift();
  if (flag === '--source' && args[0]) root = path.resolve(args.shift());
  else if (flag === '--output' && args[0]) output = path.resolve(args.shift());
  else if (flag === '--include-examples') examples = true;
  else throw new Error(`未知参数：${flag}`);
}
root = path.resolve(root);
output ||= path.join(root, '_content_build');
const markerName = '.optics-content-build';
const markerValue = 'Disposable build copy created by tools/content-build/cli.mjs\n';

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(full);
  }
  return files.sort();
}

async function main() {
  if (!['check', 'prepare'].includes(command)) throw new Error('用法：node cli.mjs check|prepare [--source 目录] [--output 构建目录] [--include-examples]');
  const files = await walk(path.join(root, '_photography'));
  if (examples) files.push(...(await walk(path.join(root, '_examples'))).filter(file => path.basename(file).startsWith('photography-')));
  const results = [];
  const errors = [];
  for (const file of files) {
    const relative = path.relative(root, file);
    try {
      const result = compileFile(await fs.readFile(file, 'utf8'), relative);
      if (result.warning) console.warn(result.warning);
      results.push({ file, relative, ...result });
    } catch (error) { errors.push(error); }
  }
  if (errors.length) {
    for (const error of errors) {
      console.error(error.message);
      if (process.env.GITHUB_ACTIONS && error instanceof PhotographyError) {
        const escape = value => String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A').replaceAll(',', '%2C');
        console.error(`::error file=${escape(error.file)},line=${error.line}::${escape(error.message)}`);
      }
    }
    process.exitCode = 1;
    return;
  }
  if (command === 'prepare') {
    if (output === root || root.startsWith(output + path.sep)) throw new Error('构建目录不能是源文件目录或其上级目录。');
    try {
      const existing = await fs.readdir(output);
      if (existing.length) {
        if (await fs.readFile(path.join(output, markerName), 'utf8').catch(() => '') !== markerValue) throw new Error(`构建目录不是本工具生成的目录，不会覆盖：${output}`);
        await fs.rm(output, { recursive: true });
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const ignored = new Set(['.git', '.github', '.openai', 'node_modules', 'vendor', '_site', '_content_build', 'tools', 'validation']);
    await fs.mkdir(output, { recursive: true });
    for (const entry of await fs.readdir(root, { withFileTypes: true })) {
      if (ignored.has(entry.name) || path.join(root, entry.name) === output) continue;
      await fs.cp(path.join(root, entry.name), path.join(output, entry.name), {
        recursive: true,
        filter: source => source !== output && !path.relative(root, source).split(path.sep).some(part => ignored.has(part))
      });
    }
    await fs.writeFile(path.join(output, markerName), markerValue);
    for (const result of results.filter(item => item.changed && item.relative.startsWith('_photography' + path.sep))) {
      await fs.writeFile(path.join(output, result.relative), result.output);
    }
    const covers = await generateCoverImages(output);
    console.log(`已为 ${Object.keys(covers).length} 张封面生成响应式缩略图。`);
    console.log(`构建副本已生成：${output}`);
  }
  console.log(`已检查 ${results.length} 份文件；${results.filter(item => item.changed).length} 份使用摄影集标记，${results.filter(item => item.legacy).length} 份旧 YAML 原样保留。`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
