import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';

class FeedbackProduct {
  const FeedbackProduct({required this.productId, required this.name, required this.image});

  factory FeedbackProduct.fromJson(Map<String, dynamic> json) => FeedbackProduct(
        productId: json['productId']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Product',
        image: json['image']?.toString() ?? '',
      );

  final String productId;
  final String name;
  final String image;
}

class OrderFeedbackInfo {
  const OrderFeedbackInfo({
    required this.orderId,
    required this.orderNumber,
    required this.eligible,
    required this.submitted,
    required this.skipped,
    required this.riderName,
    required this.riderTags,
    required this.products,
    required this.riderRating,
  });

  factory OrderFeedbackInfo.fromJson(Map<String, dynamic> json) {
    final rider = json['rider'];
    final feedback = json['feedback'];
    return OrderFeedbackInfo(
      orderId: json['orderId']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      eligible: json['eligible'] == true,
      submitted: json['submitted'] == true,
      skipped: json['skipped'] == true,
      riderName: rider is Map ? rider['name']?.toString() : null,
      riderTags: (json['riderTags'] as List? ?? const []).map((e) => e.toString()).toList(),
      products: (json['products'] as List? ?? const [])
          .whereType<Map>()
          .map((e) => FeedbackProduct.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      riderRating: feedback is Map ? (feedback['riderRating'] as num?)?.toInt() : null,
    );
  }

  final String orderId;
  final String orderNumber;
  final bool eligible;
  final bool submitted;
  final bool skipped;
  final String? riderName;
  final List<String> riderTags;
  final List<FeedbackProduct> products;
  final int? riderRating;

  bool get canRate => eligible && !submitted;
}

class OrderFeedbackRepository {
  OrderFeedbackRepository(this._dio);

  final Dio _dio;

  Future<OrderFeedbackInfo> fetch(String orderId) async {
    final res = await _dio.get('/api/orders/$orderId/feedback');
    final data = res.data;
    if (data is Map && data['data'] is Map) {
      return OrderFeedbackInfo.fromJson(Map<String, dynamic>.from(data['data'] as Map));
    }
    throw StateError('Unexpected feedback response');
  }

  /// Returns null on success, otherwise a message to show.
  Future<String?> submit(
    String orderId, {
    int? riderRating,
    String riderComment = '',
    List<String> riderTags = const [],
    Map<String, int> productRatings = const {},
    Map<String, String> productComments = const {},
  }) async {
    try {
      await _dio.post('/api/orders/$orderId/feedback', data: {
        'riderRating': ?riderRating,
        'riderComment': riderComment,
        'riderTags': riderTags,
        'products': [
          for (final entry in productRatings.entries)
            {
              'productId': entry.key,
              'rating': entry.value,
              'comment': productComments[entry.key] ?? '',
            },
        ],
      });
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'].toString();
      return 'Could not send feedback. Check your connection and try again.';
    }
  }

  Future<void> skip(String orderId) async {
    try {
      await _dio.post('/api/orders/$orderId/feedback', data: {'skip': true});
    } catch (_) {}
  }
}

final orderFeedbackRepositoryProvider = Provider<OrderFeedbackRepository>((ref) {
  return OrderFeedbackRepository(ref.watch(apiClientProvider).dio);
});
