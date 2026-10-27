import '../config/env.dart';

/// Admin → Banners entry from `GET /api/banners` (same source as the website).
class SiteBanner {
  const SiteBanner({
    required this.id,
    required this.imageUrl,
    this.alt = '',
    this.linkUrl = '',
    this.category = '',
    this.videoUrl = '',
    this.bgColor = '',
    this.tag = '',
    this.title = '',
    this.subtitle = '',
    this.offerText = '',
    this.device = '',
    this.order = 0,
  });

  final String id;
  final String imageUrl;
  final String alt;
  final String linkUrl;
  final String category;
  final String videoUrl;
  final String bgColor;
  final String tag;
  final String title;
  final String subtitle;
  final String offerText;
  final String device;
  final int order;

  bool get hasVideo => videoUrl.trim().isNotEmpty;

  factory SiteBanner.fromJson(Map<String, dynamic> json) {
    String s(String key) => json[key]?.toString().trim() ?? '';
    return SiteBanner(
      id: s('_id'),
      imageUrl: Env.resolveAssetUrl(s('imageUrl')),
      alt: s('alt'),
      linkUrl: s('linkUrl'),
      category: s('category'),
      videoUrl: Env.resolveAssetUrl(s('videoUrl')),
      bgColor: s('bgColor'),
      tag: s('tag'),
      title: s('title'),
      subtitle: s('subtitle'),
      offerText: s('offerText'),
      device: s('device'),
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Category name → admin category-banner key (mirrors website `categoryBannerKey`).
String categoryBannerKey(String categoryName) {
  final name = categoryName.toLowerCase();
  if (name.contains('dry') && name.contains('fruit')) return 'dryfruits';
  if (name.contains('fruit')) return 'fruits';
  if (name.contains('dairy')) return 'dairy';
  if (name.contains('vegetable')) return 'vegetables';
  if (name.contains('beverage')) return 'beverages';
  if (name.contains('oil')) return 'oils';
  if (name.contains('spice')) return 'spices';
  if (name.contains('pulse')) return 'pulses';
  if (name.contains('grain')) return 'grains';
  if (name.contains('organic')) return 'organic';
  return '';
}
