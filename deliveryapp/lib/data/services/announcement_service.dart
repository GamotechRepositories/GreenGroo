import 'dart:convert';

import '../../core/config/api_config.dart';

class HrAnnouncement {
  const HrAnnouncement({
    required this.id,
    required this.title,
    required this.body,
    this.publishedAt,
  });

  final String id;
  final String title;
  final String body;
  final DateTime? publishedAt;

  factory HrAnnouncement.fromJson(Map<String, dynamic> json) {
    return HrAnnouncement(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'].toString())
          : null,
    );
  }
}

class AnnouncementService {
  AnnouncementService._();
  static final AnnouncementService instance = AnnouncementService._();

  Future<List<HrAnnouncement>> fetchLive() async {
    final res = await apiGet(
      '/api/admin-ops/hr/announcements/live?role=delivery_boy',
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    final decoded = jsonDecode(res.body);
    final rows = decoded is Map && decoded['data'] is List
        ? decoded['data'] as List
        : const [];
    return rows
        .whereType<Map>()
        .map((row) => HrAnnouncement.fromJson(Map<String, dynamic>.from(row)))
        .where((item) => item.title.isNotEmpty)
        .toList();
  }
}
