# 摄影集怎么写、怎么上传

摄影集现在可以用 **Markdown 文件 + 模块** 编辑。你选照片、顺序和模块，网站负责排版。

先打开 [_examples/photography-template.md](../_examples/photography-template.md)，点击 GitHub 的 **Raw** 查看原文件，再保存或复制到本地。不要把代码块外面的说明一起复制进去。

也可以直接参考已经发布的 [_photography/example-01.md](../_photography/example-01.md)。示例 01、02、03 都使用同一套 magazine 模块版式，不需要另填样式字段。

## 一次发布只需要两类文件

1. 照片：放在 `assets/images/你的摄影集文件夹/`。
2. 摄影集：在 `_photography/` 中新建 `你的摄影集名字.md`。

例如：照片为 `assets/images/my-album/01.jpg`，在文件开头统一写 `image_base: /assets/images/my-album/`，下面的 `src` 就只需写 `01.jpg`。文件名的大小写和扩展名必须一致；不要写电脑上的 `/Users/...` 路径。文件夹和文件名建议用英文字母、数字和短横线，减少路径错误。

`_photography/my-album.md` 发布后的地址是 `/photography/my-album/`。不用像文章一样把日期放到文件名前面。标题在文件的 `title` 里写，可以用中文。

## 文件开头

```yaml
---
title: 摄影集示例 01
description: 这是一段摄影集的示例文字。
date: 2026-09-07
location: 示例地点
camera: 示例设备
image_base: /assets/images/my-album/
cover: cover.jpg
cover_alt: 这是一段图片说明示例文字。
density: airy

opening:
  src: 01.jpg
  alt: 这是一段图片说明示例文字。

blocks:
  - type: image
    src: 02.jpg
---
```

- `image_base` 是这篇摄影集的统一图片目录，末尾的 `/` 可写可不写。
- `cover` 是列表书册使用的封面，`opening` 是详情页分隔线下方的第一张照片，按单图模块的横竖方规则展示。两者可以用同一张，也可以不同；开场图可删除。
- `location`、`camera`、图片的 `caption`、文字模块的 `heading` 都可以不写。
- `density: airy` 是疏朗；`density: full` 是铺展。
- 下面的模块全部放进同一个 `blocks:`，按顺序出现。不要给每个模块另写一个 `blocks:`。

**横图、竖图和方图会按图片的真实尺寸自动识别，不需要你填写 M01-A、M01-B 等编号。** 编号用于看方案和讨论，发布文件写下面的模块类型即可。网站不会把真实横图裁成竖图或方图。

## 页头与开场照片

所有摄影集统一使用 magazine 排版：桌面上标题在左，简介、地点、日期、照片数与设备在右，下方以细线分隔；手机上按标题、信息、细线的顺序展开。

`opening` 只控制可选的第一张照片，不再放在标题右侧。删除它不会影响页头；也可以不写 `opening`，直接从 `blocks` 中的单图、双联或任意模块开始。已有的开场照片会自动移到分隔线下方，照片与内容顺序均保留。

## 图片目录只写一次

设置 `image_base` 后，`cover`、`opening.src`、所有模块的 `src`，以及 `images` 中直接填写的文件名，都会自动接上这个目录。子文件夹也可以写成 `details/01.jpg`。

```yaml
image_base: /assets/images/my-album/
cover: cover.jpg
opening:
  src: 01.jpg
blocks:
  - type: diptych
    images:
      - 02.jpg
      - 03.jpg
```

需要混用别处的照片时，以 `/` 开头的站内完整路径（如 `/assets/images/window-light.webp`）或 `https://` 开头的外部图片地址会直接使用，不会再加上 `image_base`。不填写 `image_base` 时，原来的完整路径写法继续有效，图片路径不用修改。

这个简写用于摄影集封面和照片模块。`text` 里或文件末尾手写的普通 Markdown 图片链接仍按原来的路径填写。

## 模块速查

| 预览编号 | 写法 | 图片数量 / 特点 |
| --- | --- | --- |
| M01 | `type: image` | 单张；横竖方自动适配 |
| M02 | `type: diptych` | 两张；混合比例等高，方图对间距更大 |
| M03 | `type: triptych` | 三张；横竖方均可，手机逐张展示 |
| M04 | `type: asymmetric` | 两张大小图，照片垂直居中 |
| M05 | `type: image_text` + `variant: short` | 图片配短文，侧边文字居中 |
| M06 | `type: image_text` + `variant: long` | 图片配长文，顶部对齐 |
| M07 | `type: text` | 无图；居中、左文右空、左空右文或两段并列 |

同一类里横图换成竖图，只改图片路径。M04-F 用 `main: right`，M06-D 用 `image_side: right`。不同模块可以自由穿插，也可以重复使用。

## 可复制的模块写法

以下每一段从 `- type` 开始复制，放到 `blocks:` 下面，保持两格缩进。示例都沿用文件开头的 `image_base`，因此只填写文件名。

### M01：单张照片

```yaml
  - type: image
    src: 01.jpg
    alt: 这是一段图片说明示例文字。
    caption: 这是一段图片说明示例文字。
```

单张方图与横图使用同一档留白下的版面宽度，左右边缘对齐；不再额外缩小。单张竖图会收窄并控制展示高度。`caption` 是看得见的图注，`alt` 是图片说明，供读屏和图片加载失败时使用。

### M02：双联

```yaml
  - type: diptych
    images:
      - 02.jpg
      - 03.jpg
    caption: 这是一段图片说明示例文字。
```

两张方图的整体宽度与其他照片模块对齐，自动使用 M02-C 的较大间距；双联两侧不再额外内缩。横竖混合会等高排列。手机默认保留竖图、方图与混合双联；两张横图改为上下排列。

如果某一组两张横图在手机上也必须并排，可在该模块加 `mobile: pair`；想让任意双联在手机上上下排列，则加 `mobile: stack`。

### M03：三图组

```yaml
  - type: triptych
    images:
      - 04.jpg
      - 05.jpg
      - 06.jpg
    caption: 这是一段图片说明示例文字。
```

优先用于三张竖图，也支持三横、三方或混合比例。手机上按文件顺序逐张展开。

### M04：大小图

```yaml
  - type: asymmetric
    main: left
    images:
      - src: 07.jpg
        caption: 这是一段图片说明示例文字。
      - src: 08.jpg
        caption: 这是一段图片说明示例文字。
```

`main: left` 是左图为主，改成 `right` 则右图为主。左右位置仍按照 `images` 的顺序。两张照片的垂直中心对齐，图注换行不会带偏照片位置。

### M05：图片＋短文

```yaml
  - type: image_text
    variant: short
    src: 09.jpg
    heading: 示例标题
    text: |
      这是一段摄影集正文的示例文字。
```

`heading` 可以删除。想把图片放到右侧，加一行 `image_side: right`。

### M06：图片＋长文

```yaml
  - type: image_text
    variant: long
    src: 10.jpg
    heading: 示例标题
    text: |
      这是一段摄影集正文的示例文字。

      这是第二段示例文字，可以使用 **加粗**、*斜体*。

      > 这是一段引用示例文字。
```

正文通过 Markdown 渲染，沿用文章页的文字样式。长文会自然延长这一组，不会被截断或自动缩小字号。手机上两栏改为纵向；图片在右的模块先读左侧文字，再看图片。

### M07：纯文字与留白

```yaml
  - type: text
    align: left
    heading: 示例标题
    text: |
      这是一段摄影集正文的示例文字。

      这是一段摄影集正文的示例文字。
```

| `align` | 效果 |
| --- | --- |
| `center` | 居中窄栏；默认值 |
| `left` | 左半栏文字，右半栏留白 |
| `right` | 左半栏留白，右半栏文字 |

这里的 `align` 决定文字栏放在哪里，段落本身仍左对齐。手机会收起空白半栏。

两段文字并列时这样写，不需要 `align`：

```yaml
  - type: text
    columns:
      - heading: 示例标题
        text: |
          这是一段左栏示例文字。
      - heading: 示例标题
        text: |
          这是一段右栏示例文字。
```

## 同一篇里混用两档留白

文件开头的 `density` 决定整篇的默认值；在单个模块里再写一次即可覆盖：

```yaml
density: airy
blocks:
  - type: image
    density: full
    src: 01.jpg

  - type: text
    align: right
    text: |
      这是一段摄影集正文的示例文字。
```

这里单张照片采用铺展，其余模块继续疏朗。单个模块在当前页面容器内增加占比；整篇都希望更宽时，把文件开头也改成 `full`。

## 照片说明与比例提示

`images` 里直接写文件名最短；需要单独的图注、图片说明时，用 `src` 对象：

```yaml
    images:
      - src: 01.jpg
        alt: 这是一段图片说明示例文字。
        caption: 这是一段图片说明示例文字。
        ratio: "3:2"
      - src: 02.jpg
        ratio: "2:3"
```

`ratio` 完全可选，用于照片加载前预留合适的布局；可以写 `"3:2"`、`"2:3"`、`"1:1"`。照片加载后以真实尺寸为准，填错比例也不会强制裁切。浏览器关闭 JavaScript 时照片和文字仍可阅读，自动等高和横竖适配会退回基础布局。

## 在本地编辑，再上传到 GitHub

1. 用常用的文本编辑器打开范本，另存为自己的 `.md` 文件。保留开头和结尾两行 `---`。
2. 修改标题、日期、地点，填写 `image_base` 照片目录和 `cover` 封面文件名；选用需要的模块，删掉不需要的模块，把示例文件名替换成自己的照片文件名。
3. 在 GitHub 仓库打开 `assets/images`，选择 **Add file → Upload files**，上传这本摄影集的照片文件夹并提交到 `main`。
4. 打开仓库的 `_photography` 文件夹，同样用 **Upload files** 上传 `.md` 并提交到 `main`。如果修改现有摄影集，直接编辑对应文件即可。
5. 等仓库 **Actions** 里的 Pages 构建变绿，再打开网站的摄影列表。新的摄影集会自动出现；未设置 `featured: true` 不会成为首页指定的摄影集。

已经在本地用 Git 管理仓库的话，也可以把照片和 `.md` 一起提交、推送到 `main`。

装过本项目的 Ruby/Jekyll 环境时，在仓库根目录运行 `bundle exec jekyll serve`，再打开 `http://127.0.0.1:4000` 本地预览。直接双击 `.md` 或 `.html` 不会运行网站的模块模板。

## 最容易写错的地方

- 用空格缩进，不要用 Tab。`blocks` 下面的 `- type` 缩进两格；`text: |` 下面的文字继续缩进。
- `text: |` 的竖线要保留，多段文字中间空一行。
- 标题里如果包含英文冒号加空格，给整行值加引号，例如 `title: "示例: 摄影集"`。
- 双联、大小图写两张，三图组写三张，两栏文字写两栏。
- 正文直接写普通 Markdown，不需要编写 Jekyll 或 Liquid 模板指令。
- 后续再次上传照片或修改文件时，先同步自己最新的仓库，避免覆盖上次修改。

照片模块全部放在 `---` 之间。结尾 `---` 后面如果继续写普通 Markdown，会作为摄影集末尾的居中正文显示；留空也可以。
