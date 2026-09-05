# VIO 光学 · Jekyll 个人站

VIO 光学的 GitHub Pages / Jekyll 站点，包含文章、摄影集、移动端导航、RSS 与基础 SEO。

## 第一次使用

1. 修改 `_config.yml` 中的 `url`。如果仓库名不是 `你的用户名.github.io`，把 `baseurl` 改为 `/仓库名`。
2. 把 `_includes/footer.html` 和 `about.md` 里的 `hello@example.com` 换成你的邮箱。
3. 在 GitHub 仓库的 **Settings → Pages** 中选择 **Deploy from a branch**，分支选择 `main`、目录选择 `/ (root)`。

## 发布文章

在 `_posts` 中新建 `YYYY-MM-DD-英文标题.md`：

```yaml
---
title: 文章标题
subtitle: 一句话副标题
date: 2026-09-04 20:00:00 +0800
category: 生活随笔
excerpt_text: 文章列表中的摘要。
reading_time: 5
cover: /assets/images/cover.webp
cover_alt: 图片内容描述
---
```

Front Matter 之后直接写 Markdown 正文即可。

## 发布摄影专题

在 `_photography` 中新建一个 Markdown 文件，参考现有三个中性占位示例。当前占位示例统一使用 `/assets/images/window-light.webp`；正式发布时替换标题、说明与图片。图片放进 `assets/images`，建议使用 WebP，长边 1600–2400px。

## 本地预览

```bash
bundle install
bundle exec jekyll serve
```

打开 `http://127.0.0.1:4000`。`_posts` 中的文章属于真实内容，不应作为示例删除；`_photography` 中标有“摄影集示例”的条目属于占位内容。

## 使用 AI 修改前

先阅读根目录的 `AGENTS.md` 和 `docs/PROJECT_BASELINE.md`。任何修改都必须基于远端 `main` 的最新版本，只改用户明确指定的范围。
