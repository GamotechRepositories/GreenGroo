import 'package:firebase_messaging/firebase_messaging.dart';

class PushNotificationPayload {
  const PushNotificationPayload({
    this.title,
    this.body,
    this.data = const {},
    this.messageId,
  });

  final String? title;
  final String? body;
  final Map<String, dynamic> data;
  final String? messageId;

  String? get type => data['type']?.toString();

  String? get orderId {
    final value = data['orderId']?.toString();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  String? get offerId {
    final value = data['offerId']?.toString();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  String? get notificationId {
    final value = data['notificationId']?.toString();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  factory PushNotificationPayload.fromRemoteMessage(RemoteMessage message) {
    return PushNotificationPayload(
      title: message.notification?.title ?? message.data['title']?.toString(),
      body: message.notification?.body ?? message.data['body']?.toString(),
      data: Map<String, dynamic>.from(message.data),
      messageId: message.messageId,
    );
  }

  Map<String, dynamic> toNavigationMap() {
    return {
      'title': title ?? '',
      'body': body ?? '',
      'type': type ?? '',
      'orderId': orderId ?? '',
      'offerId': offerId ?? '',
      'notificationId': notificationId ?? '',
      'messageId': messageId ?? '',
      ...data,
    };
  }
}
