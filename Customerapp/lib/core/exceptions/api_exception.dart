import 'package:dio/dio.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.cause});

  final String message;
  final int? statusCode;
  final Object? cause;

  factory ApiException.fromDio(DioException error) {
    final response = error.response;
    final data = response?.data;

    if (data is Map<String, dynamic>) {
      final message = data['message']?.toString();
      if (message != null && message.isNotEmpty) {
        return ApiException(
          message,
          statusCode: response?.statusCode,
          cause: error,
        );
      }
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return ApiException(
          'Connection timed out. Check your network and API URL.',
          statusCode: response?.statusCode,
          cause: error,
        );
      case DioExceptionType.connectionError:
        return ApiException(
          'Cannot reach the backend. Ensure the server is running.',
          statusCode: response?.statusCode,
          cause: error,
        );
      default:
        return ApiException(
          error.message ?? 'Something went wrong',
          statusCode: response?.statusCode,
          cause: error,
        );
    }
  }

  @override
  String toString() => message;
}

String apiErrorMessage(
  Object error, {
  String fallback = 'Something went wrong. Please try again.',
}) {
  if (error is ApiException) {
    return _sanitizeApiMessage(error.message, fallback: fallback);
  }
  if (error is DioException) {
    if (error.error is ApiException) {
      return _sanitizeApiMessage(
        (error.error as ApiException).message,
        fallback: fallback,
      );
    }
    final message = error.message;
    if (message != null && message.isNotEmpty) {
      return _sanitizeApiMessage(message, fallback: fallback);
    }
  }
  return fallback;
}

String _sanitizeApiMessage(String? value, {required String fallback}) {
  if (value == null) return fallback;
  final trimmed = value.trim();
  if (trimmed.isEmpty) return fallback;
  final lower = trimmed.toLowerCase();
  if (lower == 'undefined' || lower == 'null' || lower == 'nan') {
    return fallback;
  }
  return trimmed;
}
