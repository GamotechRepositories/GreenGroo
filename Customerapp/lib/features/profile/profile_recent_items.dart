import '../../models/order.dart';

class RecentOrderItem {
  const RecentOrderItem({
    required this.item,
    required this.order,
  });

  final OrderItem item;
  final Order order;
}

List<RecentOrderItem> extractRecentOrderItemsWithOrder(
  List<Order> orders, {
  int maxItems = 12,
}) {
  final eligible = orders
      .where((order) =>
          order.status != 'cancelled' &&
          order.status != 'canceled' &&
          order.status != 'attempted')
      .toList()
    ..sort(
      (a, b) => (b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)),
    );

  final seen = <String>{};
  final items = <RecentOrderItem>[];

  for (final order in eligible) {
    for (final item in order.items) {
      if (item.productId.isEmpty) continue;
      // Key by orderId + productId so that each placed preorder / order maintains its exact record
      final key = '${order.id}_${item.productId}';
      if (seen.contains(key)) continue;
      seen.add(key);
      items.add(RecentOrderItem(item: item, order: order));
      if (items.length >= maxItems) return items;
    }
  }

  return items;
}

List<OrderItem> extractRecentOrderItems(
  List<Order> orders, {
  int maxItems = 12,
}) {
  final eligible = orders
      .where((order) => order.status != 'cancelled' && order.status != 'attempted')
      .toList()
    ..sort(
      (a, b) => (b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)),
    );

  final seen = <String>{};
  final items = <OrderItem>[];

  for (final order in eligible) {
    for (final item in order.items) {
      if (item.productId.isEmpty || seen.contains(item.productId)) continue;
      seen.add(item.productId);
      items.add(item);
      if (items.length >= maxItems) return items;
    }
  }

  return items;
}

String profileFirstName(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty);
  return parts.isEmpty ? 'there' : parts.first;
}

String profileInitials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  if (parts.length == 1) {
    return parts.first.substring(0, parts.first.length >= 2 ? 2 : 1).toUpperCase();
  }
  return '${parts.first[0]}${parts[1][0]}'.toUpperCase();
}
