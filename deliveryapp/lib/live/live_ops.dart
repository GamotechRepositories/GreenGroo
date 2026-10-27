// Applies the server's entity ops to a cached API response.
// Must mirror backend/shared/realtime/diff.js (applyOps).

const _idFields = [
  '_id',
  'id',
  'inspectionId',
  'pickupId',
  'requestNumber',
  'orderId',
  'farmerId',
  'batchId',
  'sku',
];

String? liveIdOf(dynamic item) {
  if (item is! Map) return null;
  for (final field in _idFields) {
    final value = item[field];
    if (value != null && value != '') return value.toString();
  }
  return null;
}

dynamic _getAt(dynamic root, List path) {
  dynamic node = root;
  for (final key in path) {
    if (node is Map) {
      node = node[key.toString()];
    } else if (node is List && key is int && key >= 0 && key < node.length) {
      node = node[key];
    } else {
      return null;
    }
  }
  return node;
}

dynamic _setAt(dynamic root, List path, dynamic value, {bool remove = false}) {
  if (path.isEmpty) return value;
  final head = path.first;
  final rest = path.sublist(1);
  if (root is List && head is int) {
    final next = List<dynamic>.from(root);
    if (head >= 0 && head < next.length) {
      next[head] = rest.isEmpty ? value : _setAt(next[head], rest, value, remove: remove);
    }
    return next;
  }
  final next = root is Map ? Map<String, dynamic>.from(root) : <String, dynamic>{};
  final key = head.toString();
  if (rest.isEmpty) {
    if (remove) {
      next.remove(key);
    } else {
      next[key] = value;
    }
  } else {
    next[key] = _setAt(next[key], rest, value, remove: remove);
  }
  return next;
}

List<dynamic> _applyListOps(dynamic list, List<Map> ops) {
  var out = list is List ? List<dynamic>.from(list) : <dynamic>[];
  for (final op in ops) {
    final kind = op['op'];
    final id = op['id']?.toString();
    if (kind == 'remove') {
      final at = out.indexWhere((item) => liveIdOf(item) == id);
      if (at >= 0) out.removeAt(at);
    } else if (kind == 'upsert') {
      final at = out.indexWhere((item) => liveIdOf(item) == id);
      if (at >= 0) {
        out[at] = op['data'];
      } else {
        final raw = op['index'];
        final index = raw is num ? raw.toInt().clamp(0, out.length) : out.length;
        out.insert(index, op['data']);
      }
    } else if (kind == 'order') {
      final byId = {for (final item in out) liveIdOf(item): item};
      final ids = (op['ids'] as List? ?? const []).map((e) => e?.toString());
      out = [
        for (final itemId in ids)
          if (byId.containsKey(itemId)) byId[itemId],
      ];
    }
  }
  return out;
}

dynamic applyLiveOps(dynamic data, List ops) {
  dynamic root = data;
  final groups = <String, ({List path, List<Map> ops})>{};

  void flush(String key) {
    final group = groups.remove(key);
    if (group == null) return;
    root = _setAt(root, group.path, _applyListOps(_getAt(root, group.path), group.ops));
  }

  for (final raw in ops) {
    if (raw is! Map) continue;
    final kind = raw['op'];
    if (kind == 'replace') {
      groups.clear();
      root = raw['data'];
    } else if (kind == 'set') {
      for (final key in groups.keys.toList()) {
        flush(key);
      }
      final path = (raw['path'] as List?) ?? const [];
      // The server sends `data: undefined` (dropped from JSON) to delete a key.
      root = _setAt(root, path, raw['data'], remove: !raw.containsKey('data'));
    } else {
      final path = (raw['path'] as List?) ?? const [];
      final key = path.join('\u0000');
      groups.putIfAbsent(key, () => (path: path, ops: <Map>[])).ops.add(raw);
    }
  }
  for (final key in groups.keys.toList()) {
    flush(key);
  }
  return root;
}
