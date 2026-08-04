import 'package:dio/dio.dart';

import '../exceptions/api_exception.dart';
import '../../config/env.dart';
import '../storage/auth_storage.dart';

class ApiClient {
  ApiClient(this._authStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final hasAuth = options.headers.containsKey('Authorization');
          if (!hasAuth) {
            final token = _authStorage.token;
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) {
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: ApiException.fromDio(error),
              message: ApiException.fromDio(error).message,
            ),
          );
        },
      ),
    );
  }

  final AuthStorage _authStorage;
  late final Dio _dio;

  Dio get dio => _dio;
}
