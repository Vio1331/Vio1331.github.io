# 文章写法与上传

## 一篇文章对应一份 Markdown 和一个图片文件夹

- 正文：`_journal/20260909_示例标题.md`
- 图片：`assets/images/journal/20260909_示例标题/`

建议文章、摄影集统一使用 `YYYYMMDD_标题.md`。两边现在都是普通 Jekyll 集合，不需要为了系统把文件名改成 `YYYY-MM-DD-标题.md`。页面日期和排序以 front matter 的 `date` 为准，建议与文件名保持一致。

## 最常用的写法

```markdown
---
title: 示例标题
date: 2026-09-09
location: 苏州
category: 生活日记
excerpt_text: 这是一段用于卡片摘要的示例文字。
image_base: /assets/images/journal/20260909_示例标题/
cover: 01.jpg
---

## 示例小标题

这是一段示例文字。

![图片说明](02.jpg)

这是一段示例文字。
```

`cover` 和正文里的相对图片地址都会接在 `image_base` 后面。例如上面的 `02.jpg` 会读取 `/assets/images/journal/20260909_示例标题/02.jpg`。

| 字段 | 用途 |
| --- | --- |
| `title` | 文章标题 |
| `date` | 显示日期与排序，使用 `YYYY-MM-DD`；也可填写时间和时区 |
| `location` | 日期后的地点；不需要就删除 |
| `category` | `生活日记` 为浅色文章卡片，`专题文章` 为深色，其他分类默认浅色 |
| `excerpt_text` | 首页与文章列表的卡片摘要 |
| `image_base` | 本文图片的公共目录，以 `/assets/images/journal/` 开头 |
| `cover` | 可选封面，支持文件名；无封面就删除 |
| `reading_time` | 可选，手动填写阅读分钟数 |

`subtitle`、`cover_alt`、`cover_caption` 已从文章模板与现有文章中移除，不需要填写。封面的替代文字自动使用文章标题。正文照片的说明仍可写在 `![说明]` 中。

## 图片路径约定

```markdown
![说明](01.jpg)
![说明](细节/02.jpg)
![说明](<有空格的 照片.jpg>)
![说明](/assets/images/photography/20260426_在湖州/XH2S1495.jpg)
![说明](https://example.com/photo.jpg)
```

- 文件名或相对子路径：使用当前文章的 `image_base`。
- `/` 开头的站内完整路径：直接使用，不再拼接 `image_base`。
- 外链：直接使用，不改地址。
- `image_base` 末尾的 `/` 可写可不写，建议写上。
- 文件名大小写必须和上传文件一致，例如 `.JPG` 与 `.jpg` 不相同。
- 带空格的图片路径放在 `< >` 中，避免 Markdown 把它误读成其他内容。
- 普通文字链接、代码块中的图片示例不会受到影响。引用式图片 `![说明][编号]` 同样支持。

如果仍使用共享示例封面，写 `cover: /assets/images/window-light.webp`，它不受本文 `image_base` 影响。

## 上传

1. 在 GitHub 的 `assets/images/journal/` 下上传这一篇的图片文件夹。
2. 在 `_journal/` 下上传 Markdown 文件，核对 `image_base` 和文件名。
3. 提交到 `main`，等待 Actions 中 **Build and deploy OPTICS** 完成。
4. 打开文章列表与详情页确认图片。最好把文章和图片一起提交，避免构建时引用尚未上传的图片。

现有两篇文章尚缺少部分原图，文件名和补传路径见 [待补图片清单](MISSING_IMAGES.md)。新出现的错误图片路径会在构建检查中报出。

## 链接与改名

文章公开链接默认是 `/journal/标题/`，文件名前的日期不进入链接；标题中的逗号、空格等会转为连字符。现有文章沿用原链接，订阅地址仍是 `/feed.xml`。

单纯修改 front matter 的 `title` 不改变链接。修改文件名中的标题会影响默认链接；已经分享过的文章如需改文件名，可以保留原地址：

```yaml
permalink: /journal/原来的链接标题/
```

两篇文章文件名去掉日期后如果相同，可以给其中一篇加 `slug: 不同的链接名`。系统会检查重复文章链接，防止后发布的文章覆盖前一篇。
