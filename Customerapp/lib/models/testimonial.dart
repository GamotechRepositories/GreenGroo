class Testimonial {
  const Testimonial({
    required this.id,
    required this.text,
    required this.name,
    this.role = '',
    this.order = 0,
    this.isActive = true,
  });

  final String id;
  final String text;
  final String name;
  final String role;
  final int order;
  final bool isActive;

  factory Testimonial.fromJson(Map<String, dynamic> json) {
    return Testimonial(
      id: json['_id']?.toString() ?? '',
      text: json['text']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      order: json['order'] is num ? (json['order'] as num).toInt() : 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
