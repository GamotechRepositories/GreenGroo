import 'dart:convert';

/// Mirrors backend response wrapper: `{ success, data, message }`.
class ApiResponseParser {
  ApiResponseParser._();

  static dynamic _normalize(dynamic body) {
    if (body is String) {
      try {
        return jsonDecode(body);
      } catch (_) {
        return body;
      }
    }
    return body;
  }

  static dynamic getData(dynamic responseBody) {
    final body = _normalize(responseBody);
    if (body is Map) {
      return body['data'] ?? body;
    }
    return body;
  }

  static String? getMessage(dynamic responseBody) {
    final body = _normalize(responseBody);
    if (body is Map) {
      final message = body['message'] ?? body['error'] ?? body['msg'];
      return message?.toString();
    }
    return null;
  }

  static T parseObject<T>(
    dynamic responseBody,
    T Function(Map<String, dynamic> json) fromJson,
  ) {
    final data = getData(responseBody);
    if (data is! Map) {
      throw FormatException('Expected object in response.data');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }

  static List<T> parseList<T>(
    dynamic responseBody,
    T Function(Map<String, dynamic> json) fromJson,
  ) {
    final data = getData(responseBody);
    if (data is! List) return [];

    return data
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
}
