require 'nokogiri'

module Optics
  module ImagePaths
    # A single resolver serves Markdown images, journal covers and photography modules.
    def content_image_url(source, base = nil)
      source = source.to_s
      return source if source.empty? || source.match?(/\A(?:[a-z][a-z\d+.-]*:|\/\/|#)/i)
      if !source.start_with?('/') && !base.to_s.empty?
        source = "#{base.to_s.sub(%r{/+\z}, '')}/#{source.sub(%r{\A\./}, '')}"
      end
      return source if source.match?(/\A(?:[a-z][a-z\d+.-]*:|\/\/)/i)
      relative_url(source)
    end

    # Run after Kramdown: reference images work too; ordinary links and code stay intact.
    def content_image_paths(html, base = nil)
      return html if base.to_s.empty? || !html.to_s.include?('<img')
      fragment = Nokogiri::HTML.fragment(html.to_s)
      changed = false
      fragment.css('img[src]').each do |image|
        resolved = content_image_url(image['src'], base)
        next if resolved == image['src']
        image['src'] = resolved
        changed = true
      end
      changed ? fragment.to_html : html
    end
  end
end
Liquid::Template.register_filter(Optics::ImagePaths)
