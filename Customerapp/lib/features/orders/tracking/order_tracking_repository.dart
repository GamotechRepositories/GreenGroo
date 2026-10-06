import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import 'order_tracking_models.dart';

class OrderTrackingRepository {
  OrderTrackingRepository(this._dio);

  final Dio _dio;

  Future<OrderTracking> fetchTracking(String orderId) async {
    final res = await _dio.get('/api/orders/$orderId/tracking');
    final data = res.data;
    if (data is Map && data['tracking'] is Map) {
      return OrderTracking.fromJson(Map<String, dynamic>.from(data['tracking'] as Map));
    }
    throw StateError('Unexpected tracking response');
  }
}

final orderTrackingRepositoryProvider = Provider<OrderTrackingRepository>((ref) {
  return OrderTrackingRepository(ref.watch(apiClientProvider).dio);
});
