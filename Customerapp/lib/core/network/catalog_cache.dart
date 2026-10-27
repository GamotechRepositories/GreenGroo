import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../live/live_storage.dart';

/// Device-persisted stale-while-revalidate cache for catalog GETs (products,
/// categories, sections, banners, settings).
///
/// [get] answers from memory or the device copy immediately and revalidates
/// in the background; the calling provider is rebuilt only if the server's
/// response actually differs. Catalog `sync` pushes ([applySync]) patch the
/// changed item inside every cached response, so unchanged items and lists
/// are never refetched.
class CatalogCache {
  CatalogCache._();
  static final CatalogCache instance = CatalogCache._();

  static const _freshFor = Duration(minutes: 2);
  static const _maxEntries = 200;
  static const _idKeys = ['_id', 'id'];
  static const _listKeys = ['products', 'data', 'categories', 'sections', 'items', 'banners'];

  final Map<String, _CatalogEntry> _entries = {};
  final _productEvents = StreamController<Map<String, dynamic>>.broadcast();

  /// Product pushes for this store, for lists that keep their own state.
  Stream<Map<String, dynamic>> get productEvents => _productEvents.stream;

  /// [key] must identify the full request (path + every query parameter).
  /// [ref] (the calling provider) is rebuilt when the cached response changes.
  Future<dynamic> get(String key, Future<dynamic> Function() fetch, {Ref? ref}) async {
    var entry = _entries.remove(key);
    if (entry == null) {
      entry = _CatalogEntry(key);
      final saved = await LiveStorage.read(_storageKey(key));
      final existing = _entries.remove(key);
      if (existing != null) {
        entry = existing;
      } else if (saved != null) {
        entry
          ..data = saved.data
          ..hash = saved.hash
          ..hasData = true;
      }
    }
    _entries[key] = entry;
    _evict();

    if (ref != null) {
      final listener = ref.invalidateSelf;
      final target = entry;
      target.listeners.add(listener);
      ref.onDispose(() => target.listeners.remove(listener));
    }

    if (!entry.hasData) {
      await _revalidate(entry, fetch, notify: false);
      return entry.data;
    }
    if (!entry.isFresh) {
      unawaited(_revalidate(entry, fetch, notify: true).catchError((_) {}));
    }
    return entry.data;
  }

  /// Applies a catalog `sync` push: `{entity, action, id, data}`.
  void applySync(Map<String, dynamic> event) {
    final entity = event['entity']?.toString();
    final action = event['action']?.toString();
    final id = event['id']?.toString() ?? '';
    final data = event['data'] is Map ? Map<String, dynamic>.from(event['data'] as Map) : null;
    switch (entity) {
      case 'product':
        _productEvents.add(event);
        if (action == 'created') {
          _markStale('/api/products');
        } else {
          _patchAll('/api/products', id, data, remove: action == 'deleted' || data?['isActive'] == false);
        }
      case 'category':
        if (action == 'created') {
          _markStale('/api/categories');
        } else {
          _patchAll('/api/categories', id, data, remove: action == 'deleted', merge: true);
        }
      case 'section':
        if (action == 'created') {
          _markStale('/api/sections');
        } else {
          _patchAll('/api/sections', id, data, remove: action == 'deleted', merge: true);
        }
      case 'banner':
        _markStale('/api/banners');
        _markStale('/api/herobanners');
        _markStale('/api/offerbanners');
      case 'settings':
        _markStale('/api/settings');
    }
  }

  /// After a lost connection pushes may have been missed: revalidate everything.
  void markAllStale() => _markStale('');

  // ---------------------------------------------------------------------------

  static String _storageKey(String key) => 'catalog|$key';

  void _evict() {
    while (_entries.length > _maxEntries) {
      final oldest = _entries.keys.first;
      if (_entries[oldest]!.listeners.isNotEmpty) break;
      _entries.remove(oldest);
    }
  }

  Future<void> _revalidate(_CatalogEntry entry, Future<dynamic> Function() fetch, {required bool notify}) {
    return entry.inflight ??= () async {
      try {
        final data = await fetch();
        final hash = liveKeyHash(jsonEncode(data));
        entry.fetchedAt = DateTime.now();
        if (entry.hasData && hash == entry.hash) return;
        _store(entry, data, hash);
        if (notify) _notify(entry);
      } finally {
        entry.inflight = null;
      }
    }();
  }

  void _store(_CatalogEntry entry, dynamic data, String hash) {
    entry
      ..data = data
      ..hash = hash
      ..hasData = true;
    unawaited(LiveStorage.write(_storageKey(entry.key), data, hash));
  }

  void _notify(_CatalogEntry entry) {
    for (final listener in entry.listeners.toList()) {
      listener();
    }
  }

  void _markStale(String pathPrefix) {
    for (final entry in _entries.values.toList()) {
      if (!entry.key.startsWith(pathPrefix)) continue;
      entry.fetchedAt = null;
      _notify(entry);
    }
  }

  void _patchAll(String pathPrefix, String id, Map<String, dynamic>? data, {required bool remove, bool merge = false}) {
    if (id.isEmpty || (!remove && data == null)) return;
    for (final entry in _entries.values.toList()) {
      if (!entry.hasData || !entry.key.startsWith(pathPrefix)) continue;
      final next = _patchBody(entry.data, id, data, remove: remove, merge: merge);
      if (identical(next, entry.data)) continue;
      _store(entry, next, liveKeyHash(jsonEncode(next)));
      _notify(entry);
    }
  }

  static bool _sameId(dynamic item, String id) =>
      item is Map && _idKeys.any((k) => item[k] != null && item[k].toString() == id);

  /// Returns [body] itself when nothing matched, otherwise a patched copy.
  static dynamic _patchBody(dynamic body, String id, Map<String, dynamic>? data, {required bool remove, required bool merge}) {
    if (body is List) {
      final index = body.indexWhere((item) => _sameId(item, id));
      if (index < 0) return body;
      final next = List<dynamic>.from(body);
      if (remove) {
        next.removeAt(index);
      } else {
        next[index] = merge ? {...Map<String, dynamic>.from(body[index] as Map), ...data!} : data;
      }
      return next;
    }
    if (body is Map) {
      if (_sameId(body, id)) {
        if (remove) return body;
        return merge ? {...Map<String, dynamic>.from(body), ...data!} : data;
      }
      for (final key in _listKeys) {
        final child = body[key];
        if (child is! List && child is! Map) continue;
        final patched = _patchBody(child, id, data, remove: remove, merge: merge);
        if (!identical(patched, child)) return {...Map<String, dynamic>.from(body), key: patched};
      }
    }
    return body;
  }
}

class _CatalogEntry {
  _CatalogEntry(this.key);

  final String key;
  dynamic data;
  String hash = '';
  bool hasData = false;
  DateTime? fetchedAt;
  Future<void>? inflight;
  final Set<void Function()> listeners = {};

  bool get isFresh => fetchedAt != null && DateTime.now().difference(fetchedAt!) < CatalogCache._freshFor;
}
