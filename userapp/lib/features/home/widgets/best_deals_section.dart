import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../routes/route_paths.dart';
import '../home_fallback_data.dart';
import '../home_providers.dart';
import 'home_product_row.dart';

class BestDealsSection extends ConsumerWidget {
  const BestDealsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(homeDealsProvider);

    return productsAsync.when(
      loading: () => HomeProductRow(
        title: 'Best Prices Unbeatable Deals',
        onViewAll: () => context.go(RoutePaths.product),
        products: const [],
        loading: true,
      ),
      error: (_, _) => HomeProductRow(
        title: 'Best Prices Unbeatable Deals',
        onViewAll: () => context.go(RoutePaths.product),
        products: fallbackHomeProducts(),
        loading: false,
      ),
      data: (products) {
        final display = products.isEmpty
            ? fallbackHomeProducts()
            : products.take(homeProductLimit).toList();
        return HomeProductRow(
          title: 'Best Prices Unbeatable Deals',
          onViewAll: () => context.go(RoutePaths.product),
          products: display,
          loading: false,
        );
      },
    );
  }
}
