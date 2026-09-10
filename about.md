---
layout: default
title: 关于 Vio
description: 关于 Vio 和 OPTICS
permalink: /about/
section: about
---
{%- assign avatar_extensions = '.svg,.png,.jpg,.jpeg,.webp,.avif,.gif' | split: ',' -%}
{%- assign avatar_files = site.static_files | where_exp: 'file', "file.path contains '/assets/images/avatar/'" | sort: 'path' -%}
{%- capture avatar_images -%}
  [
  {%- assign avatar_separator = '' -%}
  {%- for file in avatar_files -%}
    {%- assign extension = file.extname | downcase -%}
    {%- if avatar_extensions contains extension -%}
      {{- avatar_separator -}}{{- file.path | relative_url | jsonify -}}
      {%- assign avatar_separator = ',' -%}
    {%- endif -%}
  {%- endfor -%}
  ]
{%- endcapture -%}
<section class="about-grid site-shell">
  <div class="about-mark" aria-hidden="true" data-avatar-images="{{ avatar_images | escape }}">
    <img class="brand-mark" src="{{ '/assets/images/about-avatar.svg' | relative_url }}" alt="" width="1000" height="1000">
  </div>
  <div class="about-copy">
    <p class="kicker">ABOUT / VIO</p>
    <h1>您就是<br>大名鼎鼎的V吧</h1>
    <p class="about-lead">关于 Vio 和 OPTICS</p>
    <hr>
    <p>名称「OPTICS」并没有什么特殊的含义。</p>
    <p>纯粹由于用了很多年，不太想改，以后应该也不会改。</p>
    <p>鼠标移动到头像上会触发小彩蛋～可以多试几次，会有不一样的结果。</p>
  </div>
</section>
