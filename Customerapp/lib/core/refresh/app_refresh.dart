import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/home/home_providers.dart';

Future<void> refreshHomeData(WidgetRef ref) async {
  ref.invalidate(heroBannersProvider);
  ref.invalidate(offerBannersProvider);
  ref.invalidate(categoriesProvider);
  ref.invalidate(brandsProvider);
  ref.invalidate(homeDealsProvider);
  ref.invalidate(justArrivedProvider);
  ref.invalidate(hotSellingProvider);
  ref.invalidate(recentlyViewedProductsProvider);

  await Future.wait([
    ref.read(heroBannersProvider.future),
    ref.read(offerBannersProvider.future),
    ref.read(categoriesProvider.future),
    ref.read(brandsProvider.future),
    ref.read(homeDealsProvider.future),
    ref.read(justArrivedProvider.future),
    ref.read(hotSellingProvider.future),
    ref.read(recentlyViewedProductsProvider.future),
  ]);
}
