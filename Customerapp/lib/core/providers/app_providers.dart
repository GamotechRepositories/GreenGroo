import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_service.dart';
import '../network/api_client.dart';
import '../storage/auth_storage.dart';

import 'location_provider.dart';

final authStorageProvider = Provider<AuthStorage>((ref) {
  return AuthStorage.instance;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    ref.watch(authStorageProvider),
    locationGetter: () => ref.read(deliveryLocationProvider),
  );
});

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(apiClientProvider));
});
