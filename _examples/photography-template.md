---
title: 摄影集示例 01
description: 这是一段摄影集的示例文字。
date: 2026-09-07
location: 示例地点
camera: 示例设备
cover: /assets/images/window-light.webp
cover_alt: 眼镜放在桌面上的示例图片
album_style: magazine
density: airy

# 开场照片在标题旁边；不需要时删除 opening 的整组内容。
opening:
  src: /assets/images/window-light.webp
  alt: 眼镜放在桌面上的示例图片
  caption: 这是一段图片说明示例文字。

# 每个 - type 开始一个模块；删除或移动整组即可组合版式。
blocks:
  - type: diptych
    images:
      - /assets/images/window-light.webp
      - /assets/images/window-light.webp
    caption: 这是一段图片说明示例文字。

  - type: text
    align: left
    heading: 示例标题
    text: |
      这是一段摄影集正文的示例文字。

      这是一段摄影集正文的示例文字。

  - type: image_text
    variant: long
    src: /assets/images/window-light.webp
    alt: 眼镜放在桌面上的示例图片
    caption: 这是一段图片说明示例文字。
    heading: 示例标题
    text: |
      这是一段摄影集正文的示例文字。

      这是一段摄影集正文的示例文字。

  - type: asymmetric
    main: left
    images:
      - src: /assets/images/window-light.webp
        alt: 眼镜放在桌面上的示例图片
        caption: 这是一段图片说明示例文字。
      - src: /assets/images/window-light.webp
        alt: 眼镜放在桌面上的示例图片
        caption: 这是一段图片说明示例文字。
---
