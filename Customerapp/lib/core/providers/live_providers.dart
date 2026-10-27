import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/env.dart';
import '../../live/live_cache.dart';
import '../network/catalog_cache.dart';
import 'app_providers.dart';
import 'location_provider.dart';

/// Self-updating, device-cached GETs for live endpoints (e.g. `/api/orders`).
final liveCacheProvider = Provider<LiveCache>((ref) {
  final dio = ref.watch(apiClientProvider).dio;
  final storage = ref.watch(authStorageProvider);
  return LiveCache.instance
    ..configure(
      baseUrl: () => Env.apiUrl,
      token: () => storage.token,
      fetch: (path) async => (await dio.get(path)).data,
    );
});

/// Joins the nearest store's catalog room and feeds its pushes into
/// [CatalogCache]. Watch once at the app root.
final catalogSyncProvider = Provider<void>((ref) {
  final live = ref.watch(liveCacheProvider);
  var storeId = 'none';
  void watchStore() => live.emit('catalog:watch', {'storeId': storeId});

  ref.listen(nearestStoreProvider, (_, next) {
    final id = next.value?.store?.id ?? '';
    final nextId = id.isEmpty ? 'none' : id;
    if (nextId == storeId) return;
    storeId = nextId;
    watchStore();
  }, fireImmediately: true);

  final offConnect = live.onConnect((reconnect) {
    watchStore();
    if (reconnect) CatalogCache.instance.markAllStale();
  });
  final offSync = live.on('sync', (data) {
    if (data is! Map) return;
    final event = Map<String, dynamic>.from(data);
    final eventStore = event['storeId']?.toString();
    if (event['entity'] == 'product' && eventStore != null && eventStore != storeId) return;
    CatalogCache.instance.applySync(event);
  });
  ref.onDispose(() {
    offConnect();
    offSync();
  });
});
