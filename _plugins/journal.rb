# Journal is a regular collection, so authoring filenames can be YYYYMMDD_title.md.
# Derive stable public URLs without writing generated metadata back to source files.
module Optics
  class JournalMetadata < Jekyll::Generator
    priority :high

    def generate(site)
      collection = site.collections['journal']
      return unless collection

      urls = {}
      collection.docs.reject! do |document|
        document.data['published'] == false || (!site.future && document.date > site.time)
      end
      collection.docs.each do |document|
        # Jekyll fills data['slug'] from the filename, so read the authored keys
        # separately instead of treating its generated slug as an explicit override.
        header = File.read(document.path).match(Jekyll::Document::YAML_FRONT_MATTER_REGEXP)
        authored = header ? (SafeYAML.load(header[1]) || {}) : {}
        unless authored['date']
          raise Jekyll::Errors::FatalException, "#{document.relative_path}: 请填写 date: YYYY-MM-DD。"
        end
        stem = File.basename(document.path, File.extname(document.path))
          .sub(/\A(?:\d{8}|\d{4}-\d{2}-\d{2})[-_]/, '')
        slug = Jekyll::Utils.slugify(authored['slug'] || stem, :mode => 'default', :cased => true)
        document.data['permalink'] ||= "/journal/#{slug}/"
        # The original Jekyll feed used the unescaped filename title without a trailing slash.
        document.data['journal_feed_id'] ||= "/journal/#{stem}"
        document.data['seo'] ||= {}
        document.data['seo']['type'] ||= 'BlogPosting'
        url = document.data['permalink']
        if urls.key?(url)
          raise Jekyll::Errors::FatalException, "文章链接重复：#{urls[url]} 和 #{document.relative_path}（#{url}）。请给其中一篇填写不同的 slug。"
        end
        urls[url] = document.relative_path
      end
    end
  end
end
