import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/models/address.dart';
import 'package:customer_app/models/order.dart';
import 'package:customer_app/features/profile/profile_recent_items.dart';

void main() {
  const dummyAddress = Address(
    id: 'addr-1',
    fullName: 'Rohan Sharma',
    number: '9876543210',
    email: 'rohan@example.com',
    shopNo: 'Flat 402',
    shopName: 'Home',
    fullAddress: 'Flat 402, Green Avenue, Wakad, Pune - 411057',
    landmark: 'Near D-Mart',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
  );

  group('Preorder Tracking and Timeline Tests', () {
    test('isPreOrder correctly identifies preorder orders', () {
      final preorder = Order(
        id: 'ord-pre-1',
        orderNumber: 'PRE-1001',
        items: const [
          OrderItem(
            id: 'item-1',
            productId: 'prod-mango',
            name: 'Ratnagiri Alphonso Mango',
            brandName: 'Organic Green',
            price: 599.0,
            quantity: 2,
          ),
        ],
        deliveryAddress: dummyAddress,
        paymentMethod: 'online',
        subtotal: 1198.0,
        deliveryCharges: 0.0,
        total: 1198.0,
        status: 'processing',
        paymentStatus: 'paid',
        preOrderSlot: '07:00 AM - 09:00 AM',
        preOrderDate: '29 Oct 2026',
        preOrderProgress: 'confirmed',
        preOrderProgressLabel: 'Vendor Confirmed',
      );

      final instantOrder = Order(
        id: 'ord-inst-1',
        orderNumber: 'INST-2001',
        items: const [
          OrderItem(
            id: 'item-2',
            productId: 'prod-milk',
            name: 'Fresh Cow Milk 1L',
            brandName: 'Dairy Fresh',
            price: 65.0,
            quantity: 1,
          ),
        ],
        deliveryAddress: dummyAddress,
        paymentMethod: 'online',
        subtotal: 65.0,
        deliveryCharges: 25.0,
        total: 90.0,
        status: 'shipping',
        paymentStatus: 'paid',
        preOrderSlot: '',
        preOrderDate: '',
        preOrderProgress: '',
      );

      expect(preorder.isPreOrder, isTrue);
      expect(instantOrder.isPreOrder, isFalse);
    });

    test('effectivePreOrderTimeline constructs all 8 workflow stages in chronological order', () {
      final orderTime = DateTime.parse('2026-10-28T10:00:00Z');
      final preorder = Order(
        id: 'ord-pre-2',
        orderNumber: 'PRE-1002',
        items: const [
          OrderItem(
            id: 'item-1',
            productId: 'prod-guava',
            name: 'Fresh Organic Guava',
            brandName: 'Farm Direct',
            price: 120.0,
            quantity: 1,
          ),
        ],
        deliveryAddress: dummyAddress,
        paymentMethod: 'online',
        subtotal: 120.0,
        deliveryCharges: 0.0,
        total: 120.0,
        status: 'processing',
        paymentStatus: 'paid',
        createdAt: orderTime,
        preOrderSlot: '07:00 AM - 09:00 AM',
        preOrderDate: '29 Oct 2026',
        preOrderProgress: 'confirmed',
        preOrderProgressLabel: 'Vendor Confirmed',
        storeParts: [
          OrderStorePart(
            orderNumber: 'PRE-1002',
            status: 'processing',
            isPreOrder: true,
            preOrderSlot: '07:00 AM - 09:00 AM',
            preOrderDate: '29 Oct 2026',
            preOrderProgress: 'confirmed',
            vendorConfirmedAt: DateTime.parse('2026-10-28T10:30:00Z'),
          ),
        ],
      );

      final timeline = preorder.effectivePreOrderTimeline;

      expect(timeline.length, 8);
      expect(timeline[0].key, 'awaiting_vendor');
      expect(timeline[1].key, 'confirmed');
      expect(timeline[2].key, 'preparing');
      expect(timeline[3].key, 'dispatched');
      expect(timeline[4].key, 'at_store');
      expect(timeline[5].key, 'rider_assigned');
      expect(timeline[6].key, 'out_for_delivery');
      expect(timeline[7].key, 'delivered');

      // Stage 0: Order Placed should be completed
      expect(timeline[0].isCompleted, isTrue);
      expect(timeline[0].timestamp?.toUtc(), orderTime.toUtc());

      // Stage 1: Vendor Confirmed should be current/active
      expect(timeline[1].isCurrent, isTrue);
      expect(timeline[1].timestamp, isNotNull);

      // Subsequent stages should be pending
      expect(timeline[2].isCompleted, isFalse);
      expect(timeline[2].isCurrent, isFalse);
      expect(timeline[3].isCompleted, isFalse);
    });

    test('extractRecentOrderItemsWithOrder pairs exact order with each item and preserves multiple preorders', () {
      final orderA = Order(
        id: 'ord-pre-A',
        orderNumber: 'PRE-A',
        items: const [
          OrderItem(
            id: 'item-1',
            productId: 'prod-apple',
            name: 'Himachal Apples',
            brandName: 'Fresh',
            price: 180.0,
            quantity: 1,
          ),
        ],
        deliveryAddress: dummyAddress,
        paymentMethod: 'online',
        subtotal: 180.0,
        deliveryCharges: 0.0,
        total: 180.0,
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: DateTime.parse('2026-10-25T10:00:00Z'),
        preOrderSlot: 'Slot 1',
      );

      final orderB = Order(
        id: 'ord-pre-B',
        orderNumber: 'PRE-B',
        items: const [
          OrderItem(
            id: 'item-2',
            productId: 'prod-apple', // Same product ordered in a second preorder!
            name: 'Himachal Apples',
            brandName: 'Fresh',
            price: 180.0,
            quantity: 2,
          ),
        ],
        deliveryAddress: dummyAddress,
        paymentMethod: 'online',
        subtotal: 360.0,
        deliveryCharges: 0.0,
        total: 360.0,
        status: 'processing',
        paymentStatus: 'paid',
        createdAt: DateTime.parse('2026-10-27T10:00:00Z'),
        preOrderSlot: 'Slot 2',
      );

      final recent = extractRecentOrderItemsWithOrder([orderA, orderB]);

      // Both preorders should appear with their exact order reference
      expect(recent.length, 2);
      expect(recent[0].order.id, 'ord-pre-B'); // More recent first
      expect(recent[0].order.isPreOrder, isTrue);
      expect(recent[0].item.productId, 'prod-apple');

      expect(recent[1].order.id, 'ord-pre-A'); // Previous order
      expect(recent[1].order.isPreOrder, isTrue);
      expect(recent[1].item.productId, 'prod-apple');
    });

    test('PreOrderTimelineStep handles deserialization from backend JSON', () {
      final json = {
        'key': 'confirmed',
        'title': 'Vendor Confirmed',
        'subtitle': 'Order verified and approved by Vendor',
        'time': '2026-10-28T11:00:00.000Z',
        'actor': 'Rajesh Patel',
        'done': true,
        'active': false,
      };

      final step = PreOrderTimelineStep.fromJson(json);

      expect(step.key, 'confirmed');
      expect(step.title, 'Vendor Confirmed');
      expect(step.isCompleted, isTrue);
      expect(step.isCurrent, isFalse);
      expect(step.actorName, 'Rajesh Patel');
      expect(step.timestamp, isNotNull);
    });
  });
}
