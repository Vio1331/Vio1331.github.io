---
layout: default
title: 关于 Vio
description: 关于 Vio 与 VIO 光学。
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
    <h1>您就是<br>大名鼎鼎的 V 吧。</h1>
    <p class="about-lead">夜之城没有活着的传奇，但有永不消逝的爱。</p>
    <hr>
    <p>Vio 版权所有</p>
    <p>2026 Vio All rights reserved.</p>
    <p>Copyright© Vio</p>
  </div>
</section>
