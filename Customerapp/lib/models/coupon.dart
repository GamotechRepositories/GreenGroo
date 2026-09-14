import 'package:intl/intl.dart';

final _amountFormat = NumberFormat.decimalPattern('en_IN');

String _formatAmount(num amount) => _amountFormat.format(amount.round());

/// Coupon from `GET /api/coupons/available` (mirrors frontend Coupons page).
class Coupon {
  const Coupon({
    required this.code,
    this.title = '',
    required this.discountType,
    required this.discountValue,
    this.minOrderAmount = 0,
    this.startDate,
    this.endDate,
    this.unlocked = false,
    this.amountNeeded = 0,
    this.redemptionBlocked = '',
    this.discountAmount = 0,
  });

  final String code;
  final String title;
  final String discountType;
  final double discountValue;
  final double minOrderAmount;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool unlocked;
  final double amountNeeded;
  final String redemptionBlocked;
  final double discountAmount;

  bool get isPercentage => discountType == 'percentage';

  /// Mirrors frontend `formatCouponHeadline`.
  String get headline {
    if (title.trim().isNotEmpty) return title.trim();
    final min = _formatAmount(minOrderAmount);
    if (isPercentage) {
      return 'Flat ${discountValue.toStringAsFixed(discountValue.truncateToDouble() == discountValue ? 0 : 1)}% off on orders above ₹$min';
    }
    return 'Flat ₹${_formatAmount(discountValue)} on orders above ₹$min';
  }

  /// Mirrors frontend `formatCouponUnlockMessage`.
  String get unlockMessage {
    if (redemptionBlocked.trim().isNotEmpty) return redemptionBlocked;
    if (unlocked) {
      return discountAmount > 0
          ? 'You save ₹${_formatAmount(discountAmount)} on this order'
          : 'Unlocked for your cart';
    }
    if (amountNeeded > 0) {
      return 'Shop for ₹${_formatAmount(amountNeeded)} more to unlock';
    }
    return 'Add items to your cart to unlock';
  }

  String get validityLabel {
    if (endDate == null) return '';
    return DateFormat('dd MMM yyyy').format(endDate!);
  }

  factory Coupon.fromJson(Map<String, dynamic> json) {
    return Coupon(
      code: json['code']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      discountType: json['discountType']?.toString() ?? 'percentage',
      discountValue: _toDouble(json['discountValue']),
      minOrderAmount: _toDouble(json['minOrderAmount']),
      startDate: _toDate(json['startDate']),
      endDate: _toDate(json['endDate']),
      unlocked: json['unlocked'] == true,
      amountNeeded: _toDouble(json['amountNeeded']),
      redemptionBlocked: json['redemptionBlocked']?.toString() ?? '',
      discountAmount: _toDouble(json['discountAmount']),
    );
  }
}

/// Validated coupon from `POST /api/coupons/validate` — applied at checkout.
class AppliedCoupon {
  const AppliedCoupon({
    required this.code,
    this.title = '',
    required this.discountType,
    required this.discountValue,
    required this.discountAmount,
  });

  final String code;
  final String title;
  final String discountType;
  final double discountValue;
  final double discountAmount;

  factory AppliedCoupon.fromJson(Map<String, dynamic> json) {
    return AppliedCoupon(
      code: json['code']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      discountType: json['discountType']?.toString() ?? 'percentage',
      discountValue: _toDouble(json['discountValue']),
      discountAmount: _toDouble(json['discountAmount']),
    );
  }
}

double _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

DateTime? _toDate(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}
