import '../../core/providers/app_providers.dart';
import '../../models/app_notification.dart';
import '../../services/api_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(apiServiceProvider));
});

class NotificationRepository {
  NotificationRepository(this._api);

  final ApiService _api;

  Future<void> registerToken(String token, {String deviceType = 'android'}) {
    return _api.registerFcmToken(token, deviceType: deviceType);
  }

  Future<NotificationsPageResult> getNotifications({
    int page = 1,
    int limit = 20,
  }) {
    return _api.fetchNotifications(page: page, limit: limit);
  }

  Future<int> getUnreadCount() {
    return _api.fetchUnreadNotificationCount();
  }

  Future<void> markRead(String id) {
    return _api.markNotificationRead(id);
  }

  Future<void> markAllRead() {
    return _api.markAllNotificationsRead();
  }

  Future<void> deleteNotification(String id) {
    return _api.deleteNotification(id);
  }
}
