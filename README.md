# OPTICS · Vio 的个人网站

网站使用 Jekyll 构建，文章和摄影集是两个并列的内容集合。提交到 `main` 后，GitHub Actions 自动构建并发布。

| 想做什么 | 去哪里 |
| --- | --- |
| 写文章 | `_journal/年月日_标题.md` · [文章指南](docs/JOURNAL_GUIDE.md) |
| 写摄影集 | `_photography/年月日_标题.md` · [摄影指南](docs/PHOTOGRAPHY_GUIDE.md) |
| 上传文章图片 | `assets/images/journal/年月日_标题/` |
| 上传摄影图片 | `assets/images/photography/年月日_标题/` |
| 看代码分工和脑图 | [代码地图](docs/CODE_MAP.md) |
| 查看尚未上传的旧文章图片 | [待补图片清单](docs/MISSING_IMAGES.md) |
| 让 AI 修改代码 | 先读 `AGENTS.md` 和 `docs/PROJECT_BASELINE.md` |

两类文件都可以叫 `20260909_示例标题.md`；显示日期填写 `date: 2026-09-09`。文章正文仍是 Markdown，摄影集正文仍是 Markdown 加 `::: 双联` 等中文模块标记。摄影集的旧 YAML blocks 保持兼容。

文章范本：[journal-template.md](_examples/journal-template.md)。摄影范本：[photography-template.md](_examples/photography-template.md)、[模块大全](_examples/photography-modules.md)。所有占位图统一使用原来的眼镜桌面图。

## 本地预览

需要 Node.js 22 或以上，以及 Ruby 3.1 和 Bundler。Jekyll 及 Markdown 引擎继续使用 `github-pages` 依赖；构建允许加载仓库自己的 `_plugins`。

```bash
bundle install
npm ci --prefix tools/content-build
npm test --prefix tools/content-build
bundle exec ruby tools/content-build/test/journal_test.rb
node tools/content-build/cli.mjs prepare --include-examples
bundle exec jekyll serve --source _content_build
```

打开 `http://127.0.0.1:4000`。修改源文件后重新运行 `prepare`，不编辑 `_content_build` 临时副本。直接在项目根目录运行 Jekyll 不会转换摄影集中文标记，请保留 `prepare` 这一步。

发布入口是 `.github/workflows/pages.yml`。Pages 的 Source 继续保持 **GitHub Actions**，无需更改仓库设置。
