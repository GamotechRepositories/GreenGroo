import 'dart:async';

import 'package:socket_io_client/socket_io_client.dart' as io;

import 'live_ops.dart';
import 'live_storage.dart';

typedef LiveFetch = Future<dynamic> Function(String path);

class LiveCacheException implements Exception {
  LiveCacheException(this.status, [this.message = '']);
  final int? status;
  final String message;
  @override
  String toString() => message.isNotEmpty ? message : 'Live data unavailable ($status)';
}

/// Cached, self-updating GET responses (mirror of the web `liveClient.js`).
///
/// `watch(path)` emits the last copy saved on the device immediately, then
/// subscribes to the server's live view for that endpoint with the copy's
/// version hash. The server answers "unchanged", or only the ops since that
/// version, and afterwards pushes per-item ops whenever MongoDB changes; each
/// change is applied to the cached copy and re-emitted. Endpoints the server
/// does not serve live are loaded once over HTTP (still cached on the device);
/// call [refresh] to reload those.
///
/// Use [instance] for the app's main session; create a separate [LiveCache]
/// for another session with its own token (each opens its own socket).
class LiveCache {
  LiveCache();
  static final LiveCache instance = LiveCache();

  static const _connectWait = Duration(seconds: 4);
  static const _subscribeTimeout = Duration(seconds: 15);
  static const _releaseGrace = Duration(seconds: 15);
  static const _writeDebounce = Duration(milliseconds: 400);
  static const _dropStatuses = {401, 403, 404};

  String Function() _baseUrl = () => '';
  String? Function() _token = () => null;
  LiveFetch? _fetch;

  io.Socket? _socket;
  String? _socketToken;
  final Map<String, Set<void Function(dynamic)>> _eventHandlers = {};
  final Set<String> _boundEvents = {};
  final Set<void Function(bool reconnect)> _connectHandlers = {};
  bool _everConnected = false;
  final Map<String, _LiveEntry> _entries = {};
  final Set<String> _nonLivePaths = {};
  final Map<String, Timer> _writeTimers = {};

  /// [baseUrl] is the API origin (a trailing `/api` is ignored), [token] the
  /// current bearer token, [fetch] a plain HTTP GET used for non-live endpoints.
  void configure({
    required String Function() baseUrl,
    required String? Function() token,
    required LiveFetch fetch,
  }) {
    _baseUrl = baseUrl;
    _token = token;
    _fetch = fetch;
  }

  /// Emits the cached response (if any), then every update.
  Stream<dynamic> watch(String path) {
    late StreamController<dynamic> controller;
    String? key;
    controller = StreamController<dynamic>(
      onListen: () => key = _attach(path, controller),
      onCancel: () {
        if (key != null) _detach(key!, controller);
      },
    );
    return controller.stream;
  }

  /// Live endpoints: the cached response (kept current by server pushes) or the
  /// first server response. Non-live endpoints are re-fetched over HTTP when
  /// already cached, falling back to the cached copy if that fails.
  Future<dynamic> get(String path) async {
    final entry = _entries[_keyFor(_token(), path)];
    if (entry != null && entry.hasData && _nonLivePaths.contains(_pathOnly(path))) {
      await _httpRefresh(entry);
      return entry.data;
    }
    return watch(path).first;
  }

  /// Current cached value without touching the network (null if none in memory).
  dynamic peek(String path) => _entries[_keyFor(_token(), path)]?.data;

  /// Reload a non-live endpoint over HTTP, or catch a live one up with the server.
  Future<void> refresh(String path) async {
    final entry = _entries[_keyFor(_token(), path)];
    if (entry == null) return;
    if (_nonLivePaths.contains(_pathOnly(path))) return _httpRefresh(entry);
    entry.live = false;
    entry.subscribing = null;
    if (_ensureSocket().connected) await _ensureSubscribed(entry);
  }

  /// Listens to another server event on this cache's socket (connecting it if
  /// needed). Returns a function that removes the listener.
  void Function() on(String event, void Function(dynamic data) handler) {
    final handlers = _eventHandlers.putIfAbsent(event, () => {});
    handlers.add(handler);
    _bindEvent(_ensureSocket(), event);
    return () => handlers.remove(handler);
  }

  void _bindEvent(io.Socket socket, String event) {
    if (_boundEvents.add(event)) socket.on(event, (data) => _dispatch(event, data));
  }

  /// Runs [handler] on every (re)connect, and now if already connected.
  /// `reconnect` is true when an earlier connection was lost, i.e. pushes may
  /// have been missed.
  void Function() onConnect(void Function(bool reconnect) handler) {
    _connectHandlers.add(handler);
    if (_ensureSocket().connected) handler(false);
    return () => _connectHandlers.remove(handler);
  }

  /// Emits on this cache's socket when connected (pair with [onConnect]).
  void emit(String event, dynamic data) {
    final socket = _socket;
    if (socket != null && socket.connected) socket.emit(event, data);
  }

  void _dispatch(String event, dynamic data) {
    for (final handler in (_eventHandlers[event] ?? const <void Function(dynamic)>{}).toList()) {
      handler(data);
    }
  }

  /// Call after login / logout. Logging out forgets every cached response.
  Future<void> onAuthChanged() async {
    final token = _token();
    if (token == null || token.isEmpty) {
      await clear();
    }
    if (_socket != null) _ensureSocket();
  }

  Future<void> clear() async {
    for (final entry in _entries.values) {
      entry.releaseTimer?.cancel();
    }
    _entries.clear();
    for (final timer in _writeTimers.values) {
      timer.cancel();
    }
    _writeTimers.clear();
    await LiveStorage.clear();
  }

  // ---- entries -------------------------------------------------------------

  String _keyFor(String? token, String path) {
    final who = (token == null || token.isEmpty) ? 'anon' : liveKeyHash(token);
    return '$who|$path';
  }

  static String _pathOnly(String path) {
    final q = path.indexOf('?');
    return q >= 0 ? path.substring(0, q) : path;
  }

  String _attach(String path, StreamController<dynamic> controller) {
    final token = _token();
    final key = _keyFor(token, path);
    final entry = _entries.putIfAbsent(key, () => _LiveEntry(key, path, token));
    entry.releaseTimer?.cancel();
    entry.releaseTimer = null;
    entry.listeners.add(controller);
    if (entry.hasData) controller.add(entry.data);
    _load(entry);
    return key;
  }

  void _detach(String key, StreamController<dynamic> controller) {
    final entry = _entries[key];
    if (entry == null) return;
    entry.listeners.remove(controller);
    if (entry.listeners.isNotEmpty || entry.releaseTimer != null) return;
    entry.releaseTimer = Timer(_releaseGrace, () {
      if (entry.listeners.isNotEmpty || _entries[key] != entry) return;
      _entries.remove(key);
      if (entry.live) _socket?.emit('live:unsubscribe', {'key': key});
    });
  }

  void _emit(_LiveEntry entry) {
    for (final controller in entry.listeners.toList()) {
      if (!controller.isClosed) controller.add(entry.data);
    }
  }

  void _emitError(_LiveEntry entry, Object error) {
    for (final controller in entry.listeners.toList()) {
      if (!controller.isClosed) controller.addError(error);
    }
  }

  void _setData(_LiveEntry entry, dynamic data, String hash) {
    entry.data = data;
    entry.hasData = true;
    entry.hash = hash;
    _writeTimers[entry.key]?.cancel();
    _writeTimers[entry.key] = Timer(_writeDebounce, () {
      _writeTimers.remove(entry.key);
      LiveStorage.write(entry.key, entry.data, entry.hash);
    });
  }

  void _load(_LiveEntry entry) {
    if (entry.loading != null) return;
    entry.loading = () async {
      if (!entry.hasData) {
        final saved = await LiveStorage.read(entry.key);
        if (saved != null && !entry.hasData && _entries[entry.key] == entry) {
          entry.data = saved.data;
          entry.hash = saved.hash;
          entry.hasData = true;
          _emit(entry);
        }
      }
      if (_nonLivePaths.contains(_pathOnly(entry.path))) {
        if (!entry.fetchedOnce) await _httpRefresh(entry);
        return;
      }
      if (entry.live) return;
      final connected = await _waitForConnect(_connectWait);
      if (connected) {
        await _ensureSubscribed(entry);
      } else if (!entry.hasData) {
        await _httpRefresh(entry);
      }
    }()
        .whenComplete(() => entry.loading = null);
  }

  Future<void> _httpRefresh(_LiveEntry entry) async {
    final fetch = _fetch;
    if (fetch == null) return;
    try {
      final data = await fetch(entry.path);
      entry.fetchedOnce = true;
      if (_entries[entry.key] != entry) return;
      _setData(entry, data, '');
      _emit(entry);
    } catch (error) {
      if (!entry.hasData) _emitError(entry, error);
    }
  }

  // ---- socket --------------------------------------------------------------

  io.Socket _ensureSocket() {
    final token = _token();
    final current = _socket;
    if (current != null && token == _socketToken) return current;
    current?.dispose();
    _socketToken = token;

    final origin = _baseUrl().replaceAll(RegExp(r'/+$'), '').replaceAll(RegExp(r'/api$'), '');
    final options = io.OptionBuilder()
        .setTransports(['websocket'])
        .enableForceNew()
        .enableReconnection()
        .disableAutoConnect();
    if (token != null && token.isNotEmpty) options.setAuth({'token': token});

    final socket = io.io(origin, options.build());
    socket.onConnect((_) => _handleConnect());
    socket.onDisconnect((_) {
      for (final entry in _entries.values) {
        entry.live = false;
      }
    });
    socket.on('live:patch', _handlePatch);
    socket.on('live:error', _handleLiveError);
    _boundEvents.clear();
    for (final event in _eventHandlers.keys) {
      _bindEvent(socket, event);
    }
    socket.connect();
    _socket = socket;
    return socket;
  }

  Future<bool> _waitForConnect(Duration timeout) {
    final socket = _ensureSocket();
    if (socket.connected) return Future.value(true);
    final completer = Completer<bool>();
    late void Function(dynamic) onConnect;
    final timer = Timer(timeout, () {
      socket.off('connect', onConnect);
      if (!completer.isCompleted) completer.complete(false);
    });
    onConnect = (_) {
      timer.cancel();
      socket.off('connect', onConnect);
      if (!completer.isCompleted) completer.complete(true);
    };
    socket.on('connect', onConnect);
    return completer.future;
  }

  void _handleConnect() {
    final reconnect = _everConnected;
    _everConnected = true;
    for (final handler in _connectHandlers.toList()) {
      handler(reconnect);
    }
    // The server keeps no subscriptions across connections: resubscribe with
    // our versions so it only sends what changed while we were away.
    for (final entry in _entries.values.toList()) {
      if (entry.listeners.isEmpty && entry.releaseTimer != null) {
        entry.releaseTimer?.cancel();
        _entries.remove(entry.key);
        continue;
      }
      entry.live = false;
      entry.subscribing = null;
      if (entry.hasData && !_nonLivePaths.contains(_pathOnly(entry.path))) {
        _ensureSubscribed(entry);
      }
    }
  }

  void _handlePatch(dynamic payload) {
    if (payload is! Map) return;
    final entry = _entries[payload['key']];
    if (entry == null || !entry.hasData) return;
    final baseHash = payload['baseHash']?.toString() ?? '';
    if (baseHash.isNotEmpty && entry.hash.isNotEmpty && baseHash != entry.hash) {
      // Missed an earlier patch; catch up from our version.
      entry.live = false;
      entry.subscribing = null;
      _ensureSubscribed(entry);
      return;
    }
    _setData(entry, applyLiveOps(entry.data, payload['ops'] as List? ?? const []), payload['hash']?.toString() ?? '');
    _emit(entry);
  }

  void _handleLiveError(dynamic payload) {
    if (payload is! Map) return;
    final entry = _entries.remove(payload['key']);
    if (entry == null) return;
    LiveStorage.remove(entry.key);
    _emitError(entry, LiveCacheException((payload['status'] as num?)?.toInt()));
  }

  Future<void> _ensureSubscribed(_LiveEntry entry) {
    final existing = entry.subscribing;
    if (existing != null) return existing;
    late final Future<void> pending;
    pending = _subscribe(entry).whenComplete(() {
      if (identical(entry.subscribing, pending)) entry.subscribing = null;
    });
    entry.subscribing = pending;
    return pending;
  }

  Future<void> _subscribe(_LiveEntry entry) {
    final socket = _ensureSocket();
    final seq = ++entry.seq;
    final completer = Completer<void>();
    final payload = <String, dynamic>{'key': entry.key, 'url': entry.path};
    if (entry.token != null && entry.token!.isNotEmpty) payload['token'] = entry.token;
    if (entry.hasData && entry.hash.isNotEmpty) payload['hash'] = entry.hash;

    final timer = Timer(_subscribeTimeout, () {
      if (completer.isCompleted) return;
      completer.complete();
      if (!entry.hasData) _httpRefresh(entry);
    });

    socket.emitWithAck('live:subscribe', payload, ack: (dynamic raw) async {
      timer.cancel();
      final res = raw is List && raw.isNotEmpty ? raw.first : raw;
      if (_entries[entry.key] == entry && entry.seq == seq) {
        await _applySubscribeReply(entry, res is Map ? res : const {});
      }
      if (!completer.isCompleted) completer.complete();
    });
    return completer.future;
  }

  Future<void> _applySubscribeReply(_LiveEntry entry, Map res) async {
    if (res['ok'] == true) {
      final hadData = entry.hasData;
      final hash = res['hash']?.toString() ?? '';
      var changed = false;
      if (res['unchanged'] == true) {
        // Our copy is current.
      } else if (res['ops'] is List) {
        final ops = res['ops'] as List;
        entry.data = applyLiveOps(entry.data, ops);
        changed = ops.isNotEmpty;
      } else {
        changed = !hadData || hash.isEmpty || hash != entry.hash;
        entry.data = res['data'];
      }
      entry.live = true;
      if (changed || !hadData || hash != entry.hash) _setData(entry, entry.data, hash);
      if (changed || !hadData) _emit(entry);
      return;
    }

    final reason = res['reason']?.toString();
    final status = (res['status'] as num?)?.toInt();
    if (reason == 'not_live') {
      _nonLivePaths.add(_pathOnly(entry.path));
      await _httpRefresh(entry);
    } else if (_dropStatuses.contains(status)) {
      _entries.remove(entry.key);
      LiveStorage.remove(entry.key);
      _emitError(entry, LiveCacheException(status));
    } else if (!entry.hasData) {
      await _httpRefresh(entry);
    }
  }
}

class _LiveEntry {
  _LiveEntry(this.key, this.path, this.token);

  final String key;
  final String path;
  final String? token;
  final Set<StreamController<dynamic>> listeners = {};
  dynamic data;
  bool hasData = false;
  String hash = '';
  bool live = false;
  bool fetchedOnce = false;
  int seq = 0;
  Timer? releaseTimer;
  Future<void>? loading;
  Future<void>? subscribing;
}
