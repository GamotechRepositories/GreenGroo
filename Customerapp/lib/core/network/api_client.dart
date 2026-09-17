import 'package:dio/dio.dart';

import '../exceptions/api_exception.dart';
import '../../config/env.dart';
import '../storage/auth_storage.dart';

import '../providers/location_provider.dart';

class ApiClient {
  ApiClient(this._authStorage, {DeliveryLocation? Function()? locationGetter})
      : _locationGetter = locationGetter {
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

          final path = options.path;
          if (path.contains('/api/products') || path.contains('/api/stores')) {
            final locationParams = _locationGetter?.call()?.toQueryParams();
            if (locationParams != null && locationParams.isNotEmpty) {
              options.queryParameters = {
                ...locationParams,
                ...options.queryParameters,
              };
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
  final DeliveryLocation? Function()? _locationGetter;
  late final Dio _dio;

  Dio get dio => _dio;
}
