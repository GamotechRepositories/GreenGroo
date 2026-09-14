/// Normalizes MongoDB `_id` and API `id` fields from backend JSON.
String parseJsonId(Map<String, dynamic> json) =>
    json['_id']?.toString() ?? json['id']?.toString() ?? '';

String? parseNestedId(dynamic value) {
  if (value is Map<String, dynamic>) {
    final id = parseJsonId(value);
    return id.isEmpty ? null : id;
  }
  final text = value?.toString() ?? '';
  return text.isEmpty ? null : text;
}
