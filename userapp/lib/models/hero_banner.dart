class HeroBanner {
  const HeroBanner({
    required this.id,
    required this.imageUrl,
    this.alt = 'BulkMobileMart hero banner',
    this.order = 0,
    this.isActive = true,
    this.device = 'mobile',
  });

  final String id;
  final String imageUrl;
  final String alt;
  final int order;
  final bool isActive;
  final String device;

  factory HeroBanner.fromJson(Map<String, dynamic> json) {
    return HeroBanner(
      id: json['_id']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      alt: json['alt']?.toString() ?? 'BulkMobileMart hero banner',
      order: json['order'] is num ? (json['order'] as num).toInt() : 0,
      isActive: json['isActive'] as bool? ?? true,
      device: json['device']?.toString() ?? 'mobile',
    );
  }
}
