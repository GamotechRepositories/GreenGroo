import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io_client;
import 'api_service.dart';
import 'farmer_state.dart';
import 'market_price_service.dart';
import '../models/farmer_models.dart';

class FarmerSocketService {
  FarmerSocketService._();
  static final FarmerSocketService instance = FarmerSocketService._();

  io_client.Socket? _socket;
  String? _farmerId;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect(String farmerId) {
    if (farmerId.isEmpty) {
      farmerId = 'farmer-1';
    }
    _farmerId = farmerId;

    if (_socket != null && _socket!.connected) {
      _joinRoom();
      return;
    }

    final serverUrl = ApiService().baseUrl.replaceAll(RegExp(r'/api/?$'), '');
    debugPrint('[FarmerSocket] Connecting to $serverUrl for farmer $farmerId');

    try {
      _socket = io_client.io(
        serverUrl,
        io_client.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(99999)
            .setReconnectionDelay(3000)
            .build(),
      );

      _socket!.onConnect((_) {
        _isConnected = true;
        debugPrint('[FarmerSocket] Connected to server: ${_socket!.id}');
        _joinRoom();
      });

      _socket!.onDisconnect((reason) {
        _isConnected = false;
        debugPrint('[FarmerSocket] Disconnected: $reason');
      });

      _socket!.onConnectError((err) {
        debugPrint('[FarmerSocket] Connect error: $err');
      });

      // Listen for scheme application updates (Admin approves/rejects/updates status)
      _socket!.on('scheme_application_updated', (data) {
        debugPrint('[FarmerSocket] Event scheme_application_updated: $data');
        if (data is Map) {
          _handleSchemeAppUpdate(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('govt_scheme_application_updated', (data) {
        debugPrint('[FarmerSocket] Event govt_scheme_application_updated: $data');
        if (data is Map) {
          _handleSchemeAppUpdate(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('scheme_application_created', (data) {
        debugPrint('[FarmerSocket] Event scheme_application_created: $data');
        if (data is Map) {
          _handleSchemeAppUpdate(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('govt_scheme_changed', (data) {
        debugPrint('[FarmerSocket] Event govt_scheme_changed: $data');
        FarmerState().requestSync();
      });

      // Listen for document review updates
      _socket!.on('farmer_document_status_updated', (data) {
        debugPrint('[FarmerSocket] Event farmer_document_status_updated: $data');
        FarmerState().requestSync();
      });

      // Listen for order updates
      _socket!.on('farmer_order_status_updated', (data) {
        debugPrint('[FarmerSocket] Event farmer_order_status_updated: $data');
        FarmerState().requestSync();
      });

      _socket!.on('new_order_assigned', (data) {
        debugPrint('[FarmerSocket] Event new_order_assigned: $data');
        FarmerState().requestSync();
      });

      // Listen for market price updates from Admin
      _socket!.on('market_price_updated', (data) {
        debugPrint('[FarmerSocket] Event market_price_updated: $data');
        if (data is Map) {
          MarketPriceService().handleSocketPriceUpdate(Map<String, dynamic>.from(data));
        } else {
          MarketPriceService().fetchMarketPrices();
        }
      });

      _socket!.on('market_price_deleted', (data) {
        debugPrint('[FarmerSocket] Event market_price_deleted: $data');
        if (data is Map && data['id'] != null) {
          MarketPriceService().handleSocketPriceDelete(data['id'].toString());
        } else {
          MarketPriceService().fetchMarketPrices();
        }
      });

      _socket!.on('market_prices_changed', (data) {
        debugPrint('[FarmerSocket] Event market_prices_changed: $data');
        MarketPriceService().fetchMarketPrices();
      });
    } catch (e) {
      debugPrint('[FarmerSocket] Init error: $e');
    }
  }

  void _joinRoom() {
    if (_socket == null || !_socket!.connected || _farmerId == null) return;
    _socket!.emit('join_farmer_room', {'farmerId': _farmerId});
    debugPrint('[FarmerSocket] Joined farmer room: farmer_$_farmerId');
  }

  void _handleSchemeAppUpdate(Map<String, dynamic> raw) {
    try {
      final updatedApp = GovtSchemeApplication.fromJson(raw);
      FarmerState().updateSchemeApplicationFromSocket(updatedApp);
    } catch (e) {
      debugPrint('[FarmerSocket] Error processing scheme app update: $e');
      FarmerState().fetchMySchemeApplications();
    }
  }

  void disconnect() {
    if (_socket != null) {
      try {
        _socket!.disconnect();
        _socket!.dispose();
      } catch (_) {}
      _socket = null;
      _isConnected = false;
    }
  }
}
