import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_service.dart';
import '../network/api_client.dart';
import '../storage/auth_storage.dart';

final authStorageProvider = Provider<AuthStorage>((ref) {
  throw UnimplementedError('AuthStorage must be overridden in main.dart');
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(authStorageProvider));
});

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(apiClientProvider));
});
