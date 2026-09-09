require 'minitest/autorun'
require 'jekyll'
require 'jekyll-seo-tag'
require 'tmpdir'
require 'fileutils'
require_relative '../../../_plugins/journal'
require_relative '../../../_plugins/image_paths'

class JournalTest < Minitest::Test
  ROOT = File.expand_path('../../..', __dir__)

  def with_site(documents, baseurl = '')
    Dir.mktmpdir('optics-journal-') do |directory|
      FileUtils.mkdir_p("#{directory}/_journal")
      documents.each { |name, content| File.write("#{directory}/_journal/#{name}.md", content) }
      FileUtils.cp_r("#{ROOT}/_layouts", directory)
      FileUtils.cp_r("#{ROOT}/_includes", directory)
      FileUtils.cp("#{ROOT}/feed.xml", directory)
      config = Jekyll.configuration({
        'source' => directory, 'destination' => "#{directory}/_site", 'quiet' => true,
        'url' => 'https://example.com', 'baseurl' => baseurl, 'lang' => 'zh-CN',
        'title' => '示例网站', 'author' => {'name' => 'Vio'},
        'collections' => {'journal' => {'output' => true, 'permalink' => '/journal/:name/'}},
        'defaults' => [{'scope' => {'type' => 'journal'}, 'values' => {'layout' => 'journal'}}]
      })
      site = Jekyll::Site.new(config)
      site.process
      yield site, directory
    end
  end

  def source(extra = '', body = '这是一段示例文字。')
    "---\ntitle: 示例标题\ndate: 2026-01-02\n#{extra}---\n#{body}\n"
  end

  def test_compact_filename_has_stable_url_and_legacy_feed_id
    with_site({'20260102_中文 Ingress，示例' => source}) do |site, directory|
      entry = site.collections['journal'].docs.first
      assert_equal '/journal/中文-Ingress-示例/', entry.data['permalink']
      assert_equal '/journal/中文 Ingress，示例', entry.data['journal_feed_id']
      assert File.file?("#{directory}/_site/journal/中文-Ingress-示例/index.html")
      feed = Nokogiri::XML(File.read("#{directory}/_site/feed.xml"))
      assert_empty feed.errors
      assert_equal 1, feed.xpath('//*[local-name()="entry"]').size
    end
  end

  def test_markdown_images_cover_and_feed_share_base_without_touching_links_or_code
    body = <<~MD
      ![示例图](<照片 01.jpg> "图像标题")

      ![引用式][photo]

      [photo]: second.jpg

      [普通链接](notes.html)

      ![站内](/assets/shared.png)

      ![外链](https://example.net/out.png)

      `<img src="code.png">`

      ```html
      <img src="block.png">
      ```
    MD
    with_site({'20260102_示例' => source("image_base: /assets/images/journal/示例/\ncover: cover.jpg\n", body)}, '/sub') do |site, directory|
      html = Nokogiri::HTML(File.read("#{directory}/_site/journal/示例/index.html"))
      assert html.at_css('.journal-content'), "Journal layout missing: #{html.to_html}; data=#{site.collections['journal'].docs.first.data.inspect}; content=#{site.collections['journal'].docs.first.content.inspect}; output=#{site.collections['journal'].docs.first.output.inspect}; layouts=#{site.layouts.transform_values { |l| l.content[0,150] }.inspect}"
      images = html.css('.journal-content img').map { |n| n['src'] }
      assert_equal 4, images.length, "Rendered journal content: #{html.at_css('.journal-content').to_html}"
      assert_equal ['/sub/assets/images/journal/示例/照片 01.jpg', '/sub/assets/images/journal/示例/second.jpg', '/sub/assets/shared.png', 'https://example.net/out.png'], images.map { |s| URI::DEFAULT_PARSER.unescape(s) }
      assert_equal '/sub/assets/images/journal/示例/cover.jpg', html.at_css('.journal-cover img')['src']
      assert_equal 'notes.html', html.at_css('.journal-content a')['href']
      assert_includes html.at_css('.journal-content').text, '<img src="code.png">'
      assert_includes html.at_css('.journal-content').text, '<img src="block.png">'
      feed = Nokogiri::XML(File.read("#{directory}/_site/feed.xml"))
      contents = Nokogiri::HTML.fragment(feed.at_xpath('//*[local-name()="content"]').text)
      assert_equal images, contents.css('img').map { |n| n['src'] }
    end
  end

  def test_explicit_permalink_is_respected_and_duplicate_urls_fail
    with_site({'20260102_示例' => source("permalink: /journal/keep/\n")}) do |site, directory|
      assert File.file?("#{directory}/_site/journal/keep/index.html")
    end
    assert_raises(Jekyll::Errors::FatalException) do
      with_site({'20260102_重复' => source, '20260103_重复' => source}) { flunk }
    end
  end

  def test_drafts_and_future_documents_do_not_leak_into_feed
    with_site({'20260102_公开' => source, '20260102_草稿' => source('published: false' + "\n"), '29990101_未来' => source.sub('2026-01-02','2999-01-01')}) do |site, directory|
      assert_equal 1, site.collections['journal'].docs.size
      feed = Nokogiri::XML(File.read("#{directory}/_site/feed.xml"))
      assert_equal 1, feed.xpath('//*[local-name()="entry"]').size
    end
  end
end
