import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/config/api_config.dart';

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  IO.Socket? _socket;
  String? _riderId;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  final StreamController<Map<String, dynamic>> _orderAssignedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _orderOfferController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _orderOfferExpiredController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _documentReviewController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _peakHoursController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _pickupVerifiedController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onOrderAssigned =>
      _orderAssignedController.stream;
  Stream<Map<String, dynamic>> get onOrderOfferReceived =>
      _orderOfferController.stream;
  Stream<Map<String, dynamic>> get onOrderOfferExpired =>
      _orderOfferExpiredController.stream;
  Stream<Map<String, dynamic>> get onDocumentReviewUpdate =>
      _documentReviewController.stream;
  Stream<Map<String, dynamic>> get onPeakHoursActive =>
      _peakHoursController.stream;
  Stream<Map<String, dynamic>> get onPickupVerified =>
      _pickupVerifiedController.stream;

  void connect(String riderId) {
    if (riderId.isEmpty) return;
    _riderId = riderId;

    if (_socket != null && _socket!.connected) {
      _joinRoom();
      return;
    }

    final serverUrl = ApiConfig.baseUrl;
    debugPrint('[Socket] Connecting to $serverUrl for rider $riderId');

    _socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(99999)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('[Socket] Connected to server: ${_socket!.id}');
      _joinRoom();
    });

    _socket!.onDisconnect((reason) {
      _isConnected = false;
      debugPrint('[Socket] Disconnected: $reason');
    });

    _socket!.onConnectError((err) {
      debugPrint('[Socket] Connection Error: $err');
    });

    _socket!.on('new_order_assigned', (data) {
      debugPrint('[Socket] Event new_order_assigned: $data');
      if (data is Map) {
        _orderAssignedController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('order_offer_received', (data) {
      debugPrint('[Socket] Event order_offer_received: $data');
      if (data is Map) {
        _orderOfferController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('driver_order_offer', (data) {
      debugPrint('[Socket] Event driver_order_offer: $data');
      if (data is Map) {
        _orderOfferController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('pickup_verified', (data) {
      debugPrint('[Socket] Event pickup_verified: $data');
      if (data is Map) {
        _pickupVerifiedController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('customer_address_unlocked', (data) {
      debugPrint('[Socket] Event customer_address_unlocked: $data');
      if (data is Map) {
        _pickupVerifiedController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('order_offer_expired', (data) {
      debugPrint('[Socket] Event order_offer_expired: $data');
      if (data is Map) {
        _orderOfferExpiredController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('document_review_update', (data) {
      debugPrint('[Socket] Event document_review_update: $data');
      if (data is Map) {
        _documentReviewController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('peak_hours_active', (data) {
      debugPrint('[Socket] Event peak_hours_active: $data');
      if (data is Map) {
        _peakHoursController.add(Map<String, dynamic>.from(data));
      }
    });
  }

  void _joinRoom() {
    if (_riderId != null && _riderId!.isNotEmpty && _socket != null) {
      _socket!.emit('join_rider_room', {'riderId': _riderId});
      debugPrint('[Socket] Emitted join_rider_room for riderId: $_riderId');
    }
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _isConnected = false;
    _riderId = null;
    debugPrint('[Socket] Disconnected and disposed.');
  }
}
