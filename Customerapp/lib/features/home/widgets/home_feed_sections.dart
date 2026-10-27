import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../home_providers.dart';
import 'home_product_row.dart';

/// One horizontal product row fed by [provider]; hidden when empty or on error.
class _ProviderRow extends ConsumerWidget {
  const _ProviderRow({
    required this.provider,
    required this.title,
    required this.viewAll,
  });

  final FutureProvider<List<Product>> provider;
  final String title;
  final String viewAll;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(provider).when(
          loading: () => HomeProductRow(
            title: title,
            onViewAll: () => context.push(viewAll),
            products: const [],
            loading: true,
          ),
          error: (_, _) => const SizedBox.shrink(),
          data: (products) => HomeProductRow(
            title: title,
            onViewAll: () => context.push(viewAll),
            products: products,
            loading: false,
          ),
        );
  }
}

class MostViewedSection extends StatelessWidget {
  const MostViewedSection({super.key});

  @override
  Widget build(BuildContext context) => _ProviderRow(
        provider: mostViewedProductsProvider,
        title: 'Most viewed',
        viewAll: RoutePaths.product,
      );
}

/// Shown only for signed-in users with past orders (website `BestDeals`).
class PreviouslyBoughtSection extends ConsumerWidget {
  const PreviouslyBoughtSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(previouslyBoughtProvider).value ?? const <Product>[];
    if (products.isEmpty) return const SizedBox.shrink();
    return HomeProductRow(
      title: 'Previously bought',
      onViewAll: () => context.go(RoutePaths.orders),
      products: products,
      loading: false,
    );
  }
}

/// Ready2Cook / Instant home row: that department's products only.
class DepartmentSuggestedSection extends ConsumerWidget {
  const DepartmentSuggestedSection({super.key, required this.section});

  final String section;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(departmentProductsProvider(section)).value ?? const <Product>[];
    if (products.isEmpty) return const SizedBox.shrink();
    return HomeProductRow(
      title: section == 'instantorder' ? 'Instant bestsellers' : 'Suggested for you',
      onViewAll: () => context.push('${RoutePaths.product}?section=$section'),
      products: products.take(16).toList(),
      loading: false,
    );
  }
}

/// Website "Suggested for You": the list split across two scroll rows.
class SuggestedForYouSection extends ConsumerWidget {
  const SuggestedForYouSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(suggestedProductsProvider).value ?? const <Product>[];
    if (products.isEmpty) return const SizedBox.shrink();
    final half = (products.length / 2).ceil();
    return Column(
      children: [
        HomeProductRow(
          title: 'Suggested for You',
          onViewAll: () => context.push(RoutePaths.product),
          products: products.take(half).toList(),
          loading: false,
        ),
        if (products.length > half)
          HomeProductRow(
            title: '',
            showHeader: false,
            onViewAll: () => context.push(RoutePaths.product),
            products: products.skip(half).toList(),
            loading: false,
          ),
      ],
    );
  }
}
