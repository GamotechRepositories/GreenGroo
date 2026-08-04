/// Mirrors backend response wrapper: `{ success, data, message }`.
class ApiResponseParser {
  ApiResponseParser._();

  static dynamic getData(dynamic responseBody) {
    if (responseBody is Map<String, dynamic>) {
      return responseBody['data'];
    }
    return responseBody;
  }

  static String? getMessage(dynamic responseBody) {
    if (responseBody is Map<String, dynamic>) {
      final message = responseBody['message'];
      return message?.toString();
    }
    return null;
  }

  static T parseObject<T>(
    dynamic responseBody,
    T Function(Map<String, dynamic> json) fromJson,
  ) {
    final data = getData(responseBody);
    if (data is! Map<String, dynamic>) {
      throw FormatException('Expected object in response.data');
    }
    return fromJson(data);
  }

  static List<T> parseList<T>(
    dynamic responseBody,
    T Function(Map<String, dynamic> json) fromJson,
  ) {
    final data = getData(responseBody);
    if (data is! List) return [];

    return data
        .whereType<Map<String, dynamic>>()
        .map(fromJson)
        .toList();
  }
}
