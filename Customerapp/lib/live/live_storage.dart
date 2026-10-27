export 'live_storage_web.dart' if (dart.library.io) 'live_storage_io.dart';

/// Short stable hash for file names / storage keys (FNV-1a, 32-bit).
String liveKeyHash(String value) {
  var hash = 0x811c9dc5;
  for (final unit in value.codeUnits) {
    hash ^= unit;
    hash = (hash * 0x01000193) & 0xFFFFFFFF;
  }
  return hash.toRadixString(16).padLeft(8, '0');
}

class LiveSaved {
  const LiveSaved(this.data, this.hash);
  final dynamic data;
  final String hash;
}

const liveCacheMaxAge = Duration(days: 7);
