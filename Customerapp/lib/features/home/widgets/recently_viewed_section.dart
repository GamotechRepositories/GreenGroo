import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../routes/route_paths.dart';
import '../home_providers.dart';
import 'home_product_row.dart';

class RecentlyViewedSection extends ConsumerWidget {
  const RecentlyViewedSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(recentlyViewedProductsProvider);

    return productsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (products) => HomeProductRow(
        title: 'Recently Viewed',
        onViewAll: () => context.go(RoutePaths.product),
        products: products,
        loading: false,
      ),
    );
  }
}
