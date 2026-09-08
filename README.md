# VIO 光学 · Jekyll 个人站

VIO 光学的 GitHub Pages / Jekyll 站点，包含文章、摄影集、移动端导航、RSS 与基础 SEO。

## 第一次使用

1. 修改 `_config.yml` 中的 `url`。如果仓库名不是 `你的用户名.github.io`，把 `baseurl` 改为 `/仓库名`。
2. 把 `_includes/footer.html` 和 `about.md` 里的 `hello@example.com` 换成你的邮箱。
3. 在 GitHub 仓库的 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，再到 Actions 手动运行一次 **Build and deploy OPTICS**。之后提交到 main 会自动转换摄影集标记、构建并发布。未切换时旧 YAML 仍正常发布，新标记写法尚未启用。

## 发布文章

在 `_posts` 中新建 `YYYY-MM-DD-英文标题.md`：

```yaml
---
title: 文章标题
subtitle: 一句话副标题
date: 2026-09-04 20:00:00 +0800
location: 苏州
category: 生活随笔
excerpt_text: 文章列表中的摘要。
reading_time: 5
cover: /assets/images/cover.webp
cover_alt: 图片内容描述
---
```

Front Matter 之后直接写 Markdown 正文即可。

## 发布摄影专题

在 `_photography` 中新建一个 Markdown 文件。开头填写标题、日期、图片目录和封面；正文用普通 Markdown 图片，加上 `::: 双联`、`::: 长图文 左文` 等中文标记组合版式。横竖方自动识别，支持疏朗与铺展两档留白。旧 YAML blocks 继续兼容。

- [摄影集写法与上传指南](docs/PHOTOGRAPHY_GUIDE.md)
- [可复制的 Markdown 范本](_examples/photography-template.md)
- [全部模块的可复制示例](_examples/photography-modules.md)
- [已接入的示例 01](_photography/example-01.md)

摄影集统一使用 magazine 模块版式，无需选择样式。页头为左侧标题、右侧简介与信息、下方横线；可选的 `opening` 图片在横线下方展示。占位图片仍统一使用 `/assets/images/window-light.webp`；正式发布时替换标题、说明与图片。图片放进 `assets/images`，建议使用 WebP，长边 1600–2400px。

## 本地预览

```bash
bundle install
npm ci --prefix tools/album-markup
node tools/album-markup/cli.mjs prepare --include-examples
bundle exec jekyll serve --source _album_build
```

打开 `http://127.0.0.1:4000`。修改源文件后重新运行 prepare，不编辑 `_album_build` 生成文件。`_posts` 中的文章属于真实内容，不应作为示例删除；`_photography` 中标有“摄影集示例”的条目属于占位内容。

## 使用 AI 修改前

先阅读根目录的 `AGENTS.md` 和 `docs/PROJECT_BASELINE.md`。任何修改都必须基于远端 `main` 的最新版本，只改用户明确指定的范围。
