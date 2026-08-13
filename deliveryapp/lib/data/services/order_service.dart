import 'dart:convert';
import 'package:flutter/foundation.dart';

import '../../core/config/api_config.dart';
import 'auth_service.dart';

class OrderOffer {
  const OrderOffer({
    required this.orderId,
    required this.orderNumber,
    required this.darkStoreName,
    required this.darkStoreAddress,
    required this.itemCount,
    required this.itemsSummary,
    required this.estimatedEarnings,
    required this.distanceKm,
    required this.remainingSeconds,
  });

  final String orderId;
  final String orderNumber;
  final String darkStoreName;
  final String darkStoreAddress;
  final int itemCount;
  final String itemsSummary;
  final int estimatedEarnings;
  final String distanceKm;
  final int remainingSeconds;

  factory OrderOffer.fromJson(Map<String, dynamic> json) => OrderOffer(
        orderId: json['orderId'] as String? ?? '',
        orderNumber: json['orderNumber'] as String? ?? '',
        darkStoreName: json['darkStoreName'] as String? ?? 'Dark Store',
        darkStoreAddress: json['darkStoreAddress'] as String? ?? '',
        itemCount: json['itemCount'] as int? ?? 1,
        itemsSummary: json['itemsSummary'] as String? ?? '',
        estimatedEarnings: json['estimatedEarnings'] as int? ?? 50,
        distanceKm: json['distanceKm'] as String? ?? '1.5 km',
        remainingSeconds: json['remainingSeconds'] as int? ?? 10,
      );
}

class ActiveDeliveryData {
  const ActiveDeliveryData({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.darkStoreName,
    required this.darkStoreAddress,
    required this.darkStoreQrCode,
    required this.items,
    required this.isCustomerLocationLocked,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    this.customerLat,
    this.customerLng,
    this.otpCode,
  });

  final String id;
  final String orderNumber;
  final String status;
  final String darkStoreName;
  final String darkStoreAddress;
  final String darkStoreQrCode;
  final List<dynamic> items;
  final bool isCustomerLocationLocked;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final double? customerLat;
  final double? customerLng;
  final String? otpCode;

  factory ActiveDeliveryData.fromJson(Map<String, dynamic> json) => ActiveDeliveryData(
        id: json['id'] as String? ?? '',
        orderNumber: json['orderNumber'] as String? ?? '',
        status: json['status'] as String? ?? 'assigned',
        darkStoreName: json['darkStoreName'] as String? ?? 'Dark Store',
        darkStoreAddress: json['darkStoreAddress'] as String? ?? '',
        darkStoreQrCode: json['darkStoreQrCode'] as String? ?? '',
        items: json['items'] as List<dynamic>? ?? const [],
        isCustomerLocationLocked: json['isCustomerLocationLocked'] as bool? ?? true,
        customerName: json['customerName'] as String? ?? 'Customer',
        customerPhone: json['customerPhone'] as String? ?? 'Locked',
        customerAddress: json['customerAddress'] as String? ?? 'Scan Store QR to Unlock',
        customerLat: json['customerLat'] != null ? (json['customerLat'] as num).toDouble() : null,
        customerLng: json['customerLng'] != null ? (json['customerLng'] as num).toDouble() : null,
        otpCode: json['otpCode'] as String?,
      );
}

class OrderService extends ChangeNotifier {
  OrderService._();
  static final instance = OrderService._();

  OrderOffer? _currentOffer;
  ActiveDeliveryData? _activeDelivery;

  OrderOffer? get currentOffer => _currentOffer;
  ActiveDeliveryData? get activeDelivery => _activeDelivery;

  Future<OrderOffer?> checkForOffer() async {
    if (!AuthService.instance.isLoggedIn) return null;
    try {
      final res = await apiGet(
        ApiConfig.offer,
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['offer'] != null) {
        _currentOffer = OrderOffer.fromJson(body['offer'] as Map<String, dynamic>);
        notifyListeners();
        return _currentOffer;
      }
      _currentOffer = null;
      notifyListeners();
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> acceptOffer(String orderId) async {
    try {
      final res = await apiPost(
        ApiConfig.acceptOffer(orderId),
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode == 200) {
        _currentOffer = null;
        await fetchActiveDelivery();
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> declineOffer(String orderId) async {
    try {
      final res = await apiPost(
        ApiConfig.declineOffer(orderId),
        headers: AuthService.instance.authHeaders,
      );
      _currentOffer = null;
      notifyListeners();
      return res.statusCode == 200;
    } catch (_) {
      _currentOffer = null;
      notifyListeners();
      return false;
    }
  }

  Future<ActiveDeliveryData?> fetchActiveDelivery() async {
    if (!AuthService.instance.isLoggedIn) return null;
    try {
      final res = await apiGet(
        ApiConfig.activeDelivery,
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['activeDelivery'] != null) {
        _activeDelivery = ActiveDeliveryData.fromJson(
          body['activeDelivery'] as Map<String, dynamic>,
        );
        notifyListeners();
        return _activeDelivery;
      }
      _activeDelivery = null;
      notifyListeners();
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> scanStoreQr(String orderId, String qrCode) async {
    try {
      final res = await apiPost(
        ApiConfig.scanStoreQr(orderId),
        headers: AuthService.instance.authHeaders,
        body: jsonEncode({'qrCode': qrCode}),
      );
      if (res.statusCode == 200) {
        await fetchActiveDelivery();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> completeDelivery(String orderId, String otp) async {
    try {
      final res = await apiPost(
        ApiConfig.completeDelivery(orderId),
        headers: AuthService.instance.authHeaders,
        body: jsonEncode({'otp': otp}),
      );
      if (res.statusCode == 200) {
        _activeDelivery = null;
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
