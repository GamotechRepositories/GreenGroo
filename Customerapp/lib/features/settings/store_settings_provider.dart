import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../models/store_settings.dart';

final storeSettingsProvider =
    AsyncNotifierProvider<StoreSettingsNotifier, StoreSettings?>(
  StoreSettingsNotifier.new,
);

class StoreSettingsNotifier extends AsyncNotifier<StoreSettings?> {
  @override
  Future<StoreSettings?> build() async {
    try {
      return await ref.read(apiServiceProvider).fetchStoreSettings();
    } catch (_) {
      return null;
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      return ref.read(apiServiceProvider).fetchStoreSettings();
    });
  }
}
