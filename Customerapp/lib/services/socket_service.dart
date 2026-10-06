import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/env.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/auth_state.dart';

enum SocketStatus { disconnected, connecting, connected }

/// The app's single Socket.IO connection (JWT in the handshake). Screens join
/// order rooms through it; rooms are re-joined automatically after reconnects.
class SocketService {
  io.Socket? _socket;
  String? _token;
  SocketStatus _status = SocketStatus.disconnected;

  /// orderId → number of screens watching it.
  final Map<String, int> _orderWatchers = {};

  final _locationController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _statusController = StreamController<SocketStatus>.broadcast();

  Stream<Map<String, dynamic>> get locationUpdates => _locationController.stream;
  Stream<Map<String, dynamic>> get orderStatusUpdates => _orderStatusController.stream;
  Stream<SocketStatus> get connectionStatus => _statusController.stream;
  SocketStatus get status => _status;
  bool get isConnected => _status == SocketStatus.connected;

  void connect(String token) {
    if (_socket != null && _token == token) {
      if (!_socket!.connected) _socket!.connect();
      return;
    }
    _closeSocket();
    _token = token;
    _setStatus(SocketStatus.connecting);

    final socket = io.io(
      Env.apiUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableForceNew()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionDelayMax(10000)
          .build(),
    );

    socket.onConnect((_) {
      _setStatus(SocketStatus.connected);
      for (final orderId in _orderWatchers.keys) {
        _emitJoin(orderId);
      }
    });
    socket.onDisconnect((_) => _setStatus(SocketStatus.disconnected));
    socket.onConnectError((error) {
      debugPrint('[Socket] connect error: $error');
      _setStatus(SocketStatus.disconnected);
    });
    socket.on('location_update', (data) {
      if (data is Map) _locationController.add(Map<String, dynamic>.from(data));
    });
    socket.on('order_status', (data) {
      if (data is Map) _orderStatusController.add(Map<String, dynamic>.from(data));
    });

    _socket = socket;
    socket.connect();
  }

  void disconnect() {
    _closeSocket();
    _token = null;
  }

  /// Start receiving `location_update` / `order_status` for an order.
  void joinOrder(String orderId) {
    if (orderId.isEmpty) return;
    final watchers = (_orderWatchers[orderId] ?? 0) + 1;
    _orderWatchers[orderId] = watchers;
    if (watchers == 1 && isConnected) _emitJoin(orderId);
  }

  void leaveOrder(String orderId) {
    final watchers = (_orderWatchers[orderId] ?? 0) - 1;
    if (watchers > 0) {
      _orderWatchers[orderId] = watchers;
      return;
    }
    _orderWatchers.remove(orderId);
    if (isConnected) _socket?.emit('leave_order', {'orderId': orderId});
  }

  void _emitJoin(String orderId) {
    _socket?.emitWithAck('join_order', {'orderId': orderId}, ack: (dynamic res) {
      if (res is Map && res['ok'] != true) {
        debugPrint('[Socket] join_order $orderId rejected: ${res['code']} ${res['message']}');
      }
    });
  }

  void _closeSocket() {
    final socket = _socket;
    _socket = null;
    if (socket != null) {
      socket.clearListeners();
      socket.disconnect();
      socket.dispose();
    }
    _setStatus(SocketStatus.disconnected);
  }

  void _setStatus(SocketStatus next) {
    if (_status == next) return;
    _status = next;
    if (!_statusController.isClosed) _statusController.add(next);
  }

  void dispose() {
    _closeSocket();
    _locationController.close();
    _orderStatusController.close();
    _statusController.close();
  }
}

/// Connected while the customer is logged in; disconnected on logout.
final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService();
  ref.listen<AuthState>(
    authControllerProvider,
    (_, auth) {
      final token = auth.token;
      if (auth.isLoggedIn && token != null && token.isNotEmpty) {
        service.connect(token);
      } else {
        service.disconnect();
      }
    },
    fireImmediately: true,
  );
  ref.onDispose(service.dispose);
  return service;
});
