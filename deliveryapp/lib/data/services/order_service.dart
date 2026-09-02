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
    this.timeoutSeconds = 20,
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
  final int timeoutSeconds;

  factory OrderOffer.fromJson(Map<String, dynamic> json) => OrderOffer(
        orderId: json['orderId'] as String? ?? '',
        orderNumber: json['orderNumber'] as String? ?? '',
        darkStoreName: json['darkStoreName'] as String? ?? 'Dark Store',
        darkStoreAddress: json['darkStoreAddress'] as String? ?? '',
        itemCount: json['itemCount'] as int? ?? 1,
        itemsSummary: json['itemsSummary'] as String? ?? '',
        estimatedEarnings: json['estimatedEarnings'] as int? ?? 50,
        distanceKm: json['distanceKm'] as String? ?? 'nearby',
        remainingSeconds: json['remainingSeconds'] as int? ?? 20,
        timeoutSeconds: json['timeoutSeconds'] as int? ?? 20,
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
    this.darkStorePhone,
    required this.items,
    required this.isCustomerLocationLocked,
    required this.customerAddressUnlocked,
    required this.pickupQrScanned,
    required this.pickupProofStatus,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    this.pickupQrPayload,
    this.darkStoreLat,
    this.darkStoreLng,
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
  final String? darkStorePhone;
  final List<dynamic> items;
  final bool isCustomerLocationLocked;
  final bool customerAddressUnlocked;
  final bool pickupQrScanned;
  final String pickupProofStatus;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final String? pickupQrPayload;
  final double? darkStoreLat;
  final double? darkStoreLng;
  final double? customerLat;
  final double? customerLng;
  final String? otpCode;

  factory ActiveDeliveryData.fromJson(Map<String, dynamic> json) => ActiveDeliveryData(
        id: json['id'] as String? ?? '',
        orderNumber: json['orderNumber'] as String? ?? '',
        status: json['status'] as String? ?? 'assigned',
        darkStoreName: json['darkStoreName'] as String? ?? 'Dark Store',
        darkStoreAddress: json['darkStoreAddress'] as String? ?? '',
        darkStorePhone: json['darkStorePhone'] as String?,
        darkStoreQrCode: json['darkStoreQrCode'] as String? ?? '',
        items: json['items'] as List<dynamic>? ?? const [],
        isCustomerLocationLocked: json['isCustomerLocationLocked'] as bool? ?? true,
        customerAddressUnlocked: json['customerAddressUnlocked'] as bool? ?? false,
        pickupQrScanned: json['pickupQrScanned'] as bool? ?? false,
        pickupProofStatus: json['pickupProofStatus'] as String? ?? 'none',
        customerName: json['customerName'] as String? ?? 'Customer',
        customerPhone: json['customerPhone'] as String? ?? 'Locked',
        customerAddress: json['customerAddress'] as String? ?? 'Scan Store QR to Unlock',
        pickupQrPayload: json['pickupQrPayload'] as String?,
        darkStoreLat: json['darkStoreLat'] != null ? (json['darkStoreLat'] as num).toDouble() : null,
        darkStoreLng: json['darkStoreLng'] != null ? (json['darkStoreLng'] as num).toDouble() : null,
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

  Future<bool> scanPickupQr(String orderId, String qrPayload) async {
    try {
      final res = await apiPost(
        ApiConfig.scanPickupQr(orderId),
        headers: AuthService.instance.authHeaders,
        body: jsonEncode({'qrPayload': qrPayload}),
      );
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final unlocked = body['activeDelivery'] as Map<String, dynamic>?;
        if (unlocked != null && _activeDelivery != null) {
          _activeDelivery = ActiveDeliveryData(
            id: _activeDelivery!.id,
            orderNumber: unlocked['orderNumber'] as String? ?? _activeDelivery!.orderNumber,
            status: unlocked['status'] as String? ?? _activeDelivery!.status,
            darkStoreName: _activeDelivery!.darkStoreName,
            darkStoreAddress: _activeDelivery!.darkStoreAddress,
            darkStoreQrCode: _activeDelivery!.darkStoreQrCode,
            darkStorePhone: _activeDelivery!.darkStorePhone,
            items: _activeDelivery!.items,
            isCustomerLocationLocked: unlocked['isCustomerLocationLocked'] as bool? ?? true,
            customerAddressUnlocked: unlocked['customerAddressUnlocked'] as bool? ?? false,
            pickupQrScanned: unlocked['pickupQrScanned'] as bool? ?? _activeDelivery!.pickupQrScanned,
            pickupProofStatus: unlocked['pickupProofStatus'] as String? ?? _activeDelivery!.pickupProofStatus,
            customerName: unlocked['customerName'] as String? ?? _activeDelivery!.customerName,
            customerPhone: unlocked['customerPhone'] as String? ?? _activeDelivery!.customerPhone,
            customerAddress: unlocked['customerAddress'] as String? ?? _activeDelivery!.customerAddress,
            pickupQrPayload: null,
            darkStoreLat: _activeDelivery!.darkStoreLat,
            darkStoreLng: _activeDelivery!.darkStoreLng,
            customerLat: unlocked['customerLat'] != null
                ? (unlocked['customerLat'] as num).toDouble()
                : _activeDelivery!.customerLat,
            customerLng: unlocked['customerLng'] != null
                ? (unlocked['customerLng'] as num).toDouble()
                : _activeDelivery!.customerLng,
            otpCode: unlocked['otpCode'] as String? ?? _activeDelivery!.otpCode,
          );
        }
        await fetchActiveDelivery();
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> submitPickupProof(String orderId, String imageBase64) async {
    try {
      final res = await apiPost(
        ApiConfig.submitPickupProof(orderId),
        headers: AuthService.instance.authHeaders,
        body: jsonEncode({'imageBase64': imageBase64}),
      );
      if (res.statusCode == 200) {
        await fetchActiveDelivery();
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
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
