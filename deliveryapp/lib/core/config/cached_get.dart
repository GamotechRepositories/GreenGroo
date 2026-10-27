import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../live/live_storage.dart';
import 'api_config.dart';

/// Stale-while-revalidate GET for screens whose endpoint the server does not
/// push live: [onData] gets the copy saved on this device first (instant
/// paint), then the server's response only if it differs from that copy.
/// Throws only when the server fails and nothing was saved.
Future<void> cachedApiGet(
  String path, {
  Map<String, String>? headers,
  required void Function(Map<String, dynamic> body) onData,
}) async {
  final who = headers?['Authorization'];
  final key = 'get:${who == null ? 'anon' : liveKeyHash(who)}|$path';
  final saved = await LiveStorage.read(key);
  if (saved != null && saved.data is Map) {
    onData(Map<String, dynamic>.from(saved.data as Map));
  }

  final http.Response res;
  try {
    res = await apiGet(path, headers: headers);
  } catch (_) {
    if (saved != null) return;
    rethrow;
  }
  if (res.statusCode != 200) {
    if (saved != null) return;
    throw Exception('Failed (${res.statusCode})');
  }
  final hash = liveKeyHash(res.body);
  if (saved != null && saved.hash == hash) return;
  final body = jsonDecode(res.body);
  if (body is! Map) throw Exception('Invalid response');
  final map = Map<String, dynamic>.from(body);
  await LiveStorage.write(key, map, hash);
  onData(map);
}
