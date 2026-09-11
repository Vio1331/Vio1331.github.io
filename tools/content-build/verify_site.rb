# Fail on broken local links/images after building. Only the explicitly recorded,
# pre-existing missing uploads are warnings; uploading them automatically clears the warning.
require 'nokogiri'
require 'json'
require 'uri'
require 'yaml'
require 'date'
require 'time'

site = File.expand_path(ARGV[0] || '_site')
root = File.expand_path('../..', __dir__)
known_missing = JSON.parse(File.read(File.join(__dir__, 'known-missing-images.json')))
errors = []
missing = []
counts = Hash.new(0)
Dir.glob("#{site}/**/*.html").each do |file|
  document = Nokogiri::HTML(File.read(file))
  counts['journal'] += 1 if document.at_css('article.journal')
  counts['photography'] += 1 if document.at_css('article.photography')
  document.css('img[src],script[src],link[href],a[href]').each do |node|
    urls = [node['src'] || node['href']]
    urls.concat(node['srcset'].split(',').map { |candidate| candidate.strip.split(/\s+/).first }) if node.name == 'img' && node['srcset']
    urls.each do |url|
      next if url.to_s.empty? || url.start_with?('#','//') || url.match?(/\A[a-z][a-z\d+.-]*:/i)
      pathname = URI::DEFAULT_PARSER.unescape(url.split(/[?#]/,2).first)
      target = pathname.start_with?('/') ? File.join(site, pathname.delete_prefix('/')) : File.expand_path(pathname, File.dirname(file))
      exists = File.file?(target) || File.file?(File.join(target, 'index.html'))
      next if exists
      if node.name == 'img' && known_missing.include?(pathname)
        missing << pathname
      else
        errors << "#{file.delete_prefix(site)} → #{url}"
      end
    end
  end
end
%w[journal photography].each do |section|
  expected = Dir.glob("#{root}/_#{section}/*.md").count do |file|
    data = YAML.safe_load(File.read(file).split(/^---\s*$/,3)[1], permitted_classes: [Date, Time])
    data['published'] != false && (!data['date'] || Time.parse(data['date'].to_s) <= Time.now)
  end
  errors << "#{section}: 应有 #{expected} 篇，实际 #{counts[section]} 篇" unless expected == counts[section]
end
feed = Nokogiri::XML(File.read("#{site}/feed.xml"))
errors.concat(feed.errors.map(&:message))
feed_entries = feed.xpath('//*[local-name()="entry"]')
errors << '文章订阅数量不正确' unless feed_entries.length == [counts['journal'],10].min
feed_entries.each do |entry|
  image_html = Nokogiri::HTML.fragment(entry.at_xpath('./*[local-name()="content"]').text)
  image_html.css('img[src]').each do |image|
    errors << "订阅中仍有相对图片：#{image['src']}" unless image['src'].match?(%r{\A(?:/|[a-z][a-z\d+.-]*:)}i)
  end
end
missing.uniq.each { |file| warn "尚待上传（迁移前已缺失）：#{file}" }
abort errors.uniq.join("\n") unless errors.empty?
puts "页面验证通过：#{counts['journal']} 篇文章、#{counts['photography']} 个摄影集；#{missing.uniq.length} 张旧图待上传。"
