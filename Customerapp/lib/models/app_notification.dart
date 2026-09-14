class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.orderId,
    this.orderNumber,
    this.data = const {},
    this.isRead = false,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String type;
  final String? orderId;
  final String? orderNumber;
  final Map<String, dynamic> data;
  final bool isRead;
  final DateTime createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final order = json['order'];
    String? orderId;
    String? orderNumber;

    if (order is Map<String, dynamic>) {
      orderId = order['_id']?.toString() ?? order['id']?.toString();
      orderNumber = order['orderNumber']?.toString();
    }

    orderId ??= json['order']?.toString();
    if (orderId == 'null' || orderId?.isEmpty == true) {
      orderId = null;
    }

    final rawData = json['data'];
    final data = rawData is Map<String, dynamic>
        ? Map<String, dynamic>.from(rawData)
        : <String, dynamic>{};

    orderId ??= data['orderId']?.toString();
    orderNumber ??= data['orderNumber']?.toString();

    return AppNotification(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      type: json['type']?.toString() ?? data['type']?.toString() ?? 'custom',
      orderId: orderId,
      orderNumber: orderNumber,
      data: data,
      isRead: json['isRead'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  String? get offerId {
    final value = data['offerId']?.toString();
    if (value == null || value.isEmpty) return null;
    return value;
  }

  bool get isOrderRelated {
    return type.startsWith('order_') ||
        type == 'out_for_delivery' ||
        orderId != null;
  }

  bool get isPaymentRelated {
    return type.startsWith('payment_');
  }

  bool get isOffer {
    return type == 'offer';
  }
}

class NotificationsPageResult {
  const NotificationsPageResult({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  final List<AppNotification> items;
  final int page;
  final int limit;
  final int total;
  final int pages;

  bool get hasMore => page < pages;
}
