import 'address.dart';
import '../core/utils/json_parsers.dart';

class OrderShipment {
  const OrderShipment({
    this.provider = '',
    this.carrier = '',
    this.service = '',
    this.trackingNumber = '',
    this.trackUrl = '',
    this.labelUrl = '',
    this.status = '',
    this.statusMessage = '',
    this.note = '',
    this.evidenceUrl = '',
    this.evidenceName = '',
    this.manualTracking = const OrderManualTracking(),
  });

  final String provider;
  final String carrier;
  final String service;
  final String trackingNumber;
  final String trackUrl;
  final String labelUrl;
  final String status;
  final String statusMessage;
  final String note;
  final String evidenceUrl;
  final String evidenceName;
  final OrderManualTracking manualTracking;

  bool get hasTracking => trackingNumber.trim().isNotEmpty;

  bool get hasShipmentDetails =>
      manualTracking.hasDetails ||
      note.trim().isNotEmpty ||
      evidenceUrl.trim().isNotEmpty;

  String get displayStatus {
    final value = status.trim().isNotEmpty ? status.trim() : statusMessage.trim();
    return value.isNotEmpty ? value : 'Tracking in progress';
  }

  String? get carrierServiceLabel {
    final parts = [carrier, service].where((part) => part.trim().isNotEmpty).toList();
    if (parts.isEmpty) return null;
    return parts.join(' / ');
  }

  factory OrderShipment.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const OrderShipment();
    return OrderShipment(
      provider: json['provider']?.toString() ?? '',
      carrier: json['carrier']?.toString() ?? '',
      service: json['service']?.toString() ?? '',
      trackingNumber: json['trackingNumber']?.toString() ?? '',
      trackUrl: json['trackUrl']?.toString() ?? '',
      labelUrl: json['labelUrl']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      statusMessage: json['statusMessage']?.toString() ?? '',
      note: json['note']?.toString() ?? '',
      evidenceUrl: json['evidenceUrl']?.toString() ?? '',
      evidenceName: json['evidenceName']?.toString() ?? '',
      manualTracking: json['manualTracking'] is Map<String, dynamic>
          ? OrderManualTracking.fromJson(
              json['manualTracking'] as Map<String, dynamic>,
            )
          : const OrderManualTracking(),
    );
  }
}

class OrderManualTracking {
  const OrderManualTracking({
    this.enabled = false,
    this.note = '',
    this.evidenceUrl = '',
    this.evidenceName = '',
  });

  final bool enabled;
  final String note;
  final String evidenceUrl;
  final String evidenceName;

  bool get hasDetails =>
      enabled && (note.trim().isNotEmpty || evidenceUrl.trim().isNotEmpty);

  factory OrderManualTracking.fromJson(Map<String, dynamic> json) {
    return OrderManualTracking(
      enabled: json['enabled'] == true,
      note: json['note']?.toString() ?? '',
      evidenceUrl: json['evidenceUrl']?.toString() ?? '',
      evidenceName: json['evidenceName']?.toString() ?? '',
    );
  }
}

class OrderItem {
  const OrderItem({
    required this.id,
    required this.productId,
    required this.name,
    required this.brandName,
    required this.price,
    required this.quantity,
    this.image = '',
    this.variantName = '',
    this.colorName = '',
  });

  final String id;
  final String productId;
  final String name;
  final String brandName;
  final double price;
  final int quantity;
  final String image;
  final String variantName;
  final String colorName;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final product = json['product'];
    return OrderItem(
      id: parseJsonId(json),
      productId: parseNestedId(product) ?? '',
      name: json['name']?.toString() ?? '',
      brandName: json['brandName']?.toString() ?? '',
      price: _toDouble(json['price']),
      quantity: _toInt(json['quantity']),
      image: json['image']?.toString() ??
          json['productImage']?.toString() ??
          (product is Map<String, dynamic>
              ? (product['productImages'] as List<dynamic>? ?? []).firstOrNull
                  ?.toString() ??
              ''
              : ''),
      variantName: json['variantName']?.toString() ?? '',
      colorName: json['colorName']?.toString() ?? '',
    );
  }
}
class OrderGiftHamper {
  const OrderGiftHamper({
    this.minOrderAmount = 0,
    this.giftName = '',
    this.giftDescription = '',
    this.giftImage = '',
    this.status = '',
  });

  final double minOrderAmount;
  final String giftName;
  final String giftDescription;
  final String giftImage;
  final String status;

  bool get isApproved => status == 'approved';
  bool get isPending => status == 'pending';

  /// Customer sees gift hamper only after admin approval.
  bool get isVisible => giftName.trim().isNotEmpty && isApproved;

  factory OrderGiftHamper.fromJson(Map<String, dynamic> json) {
    final gift = json['gift'];
    return OrderGiftHamper(
      minOrderAmount: _toDouble(json['minOrderAmount']),
      giftName: gift is Map<String, dynamic> ? gift['name']?.toString() ?? '' : '',
      giftDescription:
          gift is Map<String, dynamic> ? gift['description']?.toString() ?? '' : '',
      giftImage: gift is Map<String, dynamic> ? gift['image']?.toString() ?? '' : '',
      status: json['status']?.toString() ?? '',
    );
  }
}

class Order {
  const Order({
    required this.id,
    required this.orderNumber,
    required this.items,
    required this.deliveryAddress,
    required this.paymentMethod,
    required this.subtotal,
    required this.deliveryCharges,
    required this.total,
    required this.status,
    required this.paymentStatus,
    this.message = '',
    this.customerMessage = '',
    this.createdAt,
    this.codAdvancePaidAt,
    this.codAdvanceAmount = 0,
    this.razorpayPaymentId = '',
    this.razorpayOrderId = '',
    this.paidAt,
    this.shipment = const OrderShipment(),
    this.couponCode = '',
    this.couponDiscount = 0,
    this.giftHamper,
  });

  final String id;
  final String orderNumber;
  final List<OrderItem> items;
  final Address deliveryAddress;
  final String paymentMethod;
  final double subtotal;
  final double deliveryCharges;
  final double total;
  final String status;
  final String paymentStatus;
  final String message;
  final String customerMessage;
  final DateTime? createdAt;
  final DateTime? codAdvancePaidAt;
  final double codAdvanceAmount;
  final String razorpayPaymentId;
  final String razorpayOrderId;
  final DateTime? paidAt;
  final OrderShipment shipment;
  final String couponCode;
  final double couponDiscount;
  final OrderGiftHamper? giftHamper;

  factory Order.fromJson(Map<String, dynamic> json) {
    final addressJson = json['deliveryAddress'];
    return Order(
      id: parseJsonId(json),
      orderNumber: json['orderNumber']?.toString() ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(OrderItem.fromJson)
          .toList(),
      deliveryAddress: addressJson is Map<String, dynamic>
          ? Address.fromJson(addressJson)
          : const Address(
              id: '',
              fullName: '',
              number: '',
              email: '',
              shopNo: '',
              shopName: '',
              fullAddress: '',
              landmark: '',
              city: '',
              state: '',
              pincode: '',
            ),
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      subtotal: _toDouble(json['subtotal']),
      deliveryCharges: _toDouble(json['deliveryCharges']),
      total: _toDouble(json['total']),
      status: json['status']?.toString() ?? '',
      paymentStatus: json['paymentStatus']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      customerMessage: (json['customerMessage'] ??
              json['customerNote'] ??
              json['message'])
          ?.toString() ??
          '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      codAdvancePaidAt: json['codAdvancePaidAt'] != null
          ? DateTime.tryParse(json['codAdvancePaidAt'].toString())
          : null,
      codAdvanceAmount: _toDouble(json['codAdvanceAmount'] ?? json['advancePaidAmount']),
      razorpayPaymentId: json['razorpayPaymentId']?.toString() ?? '',
      razorpayOrderId: json['razorpayOrderId']?.toString() ?? '',
      paidAt: json['paidAt'] != null
          ? DateTime.tryParse(json['paidAt'].toString())
          : null,
      shipment: json['shipment'] is Map<String, dynamic>
          ? OrderShipment.fromJson(json['shipment'] as Map<String, dynamic>)
          : const OrderShipment(),
      couponCode: json['couponCode']?.toString() ?? '',
      couponDiscount: _toDouble(json['couponDiscount']),
      giftHamper: json['giftHamper'] is Map<String, dynamic>
          ? OrderGiftHamper.fromJson(json['giftHamper'] as Map<String, dynamic>)
          : null,
    );
  }
}

double _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _toInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
