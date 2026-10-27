import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import 'live_storage.dart' show LiveSaved, liveCacheMaxAge, liveKeyHash;

const _maxFiles = 300;

/// One JSON file per cached response under the app-support directory.
class LiveStorage {
  static Future<Directory?>? _dir;

  static Future<Directory?> _directory() {
    return _dir ??= () async {
      try {
        final base = await getApplicationSupportDirectory();
        final dir = Directory('${base.path}${Platform.pathSeparator}live_cache');
        await dir.create(recursive: true);
        _prune(dir);
        return dir;
      } catch (_) {
        return null;
      }
    }();
  }

  static Future<File?> _file(String key) async {
    final dir = await _directory();
    if (dir == null) return null;
    return File('${dir.path}${Platform.pathSeparator}${liveKeyHash(key)}.json');
  }

  static Future<LiveSaved?> read(String key) async {
    try {
      final file = await _file(key);
      if (file == null || !await file.exists()) return null;
      final row = jsonDecode(await file.readAsString());
      if (row is! Map || row['k'] != key) return null;
      final savedAt = DateTime.fromMillisecondsSinceEpoch((row['t'] as num?)?.toInt() ?? 0);
      if (DateTime.now().difference(savedAt) > liveCacheMaxAge) return null;
      return LiveSaved(row['d'], row['h']?.toString() ?? '');
    } catch (_) {
      return null;
    }
  }

  static Future<void> write(String key, dynamic data, String hash) async {
    try {
      final file = await _file(key);
      if (file == null) return;
      final tmp = File('${file.path}.tmp');
      await tmp.writeAsString(jsonEncode({
        'k': key,
        'h': hash,
        't': DateTime.now().millisecondsSinceEpoch,
        'd': data,
      }));
      await tmp.rename(file.path);
    } catch (_) {
      // Caching is best-effort.
    }
  }

  static Future<void> remove(String key) async {
    try {
      final file = await _file(key);
      if (file != null && await file.exists()) await file.delete();
    } catch (_) {}
  }

  static Future<void> clear() async {
    try {
      final dir = await _directory();
      if (dir == null) return;
      await for (final entity in dir.list()) {
        if (entity is File) await entity.delete();
      }
    } catch (_) {}
  }

  static Future<void> _prune(Directory dir) async {
    try {
      final files = <File, DateTime>{};
      await for (final entity in dir.list()) {
        if (entity is File) files[entity] = (await entity.stat()).modified;
      }
      final sorted = files.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
      final cutoff = DateTime.now().subtract(liveCacheMaxAge);
      for (var i = 0; i < sorted.length; i++) {
        if (i >= _maxFiles || sorted[i].value.isBefore(cutoff)) await sorted[i].key.delete();
      }
    } catch (_) {}
  }
}
