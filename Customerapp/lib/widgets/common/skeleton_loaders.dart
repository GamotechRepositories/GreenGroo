import 'package:flutter/material.dart';

import '../category/category_grid_tile.dart';
import '../layout/shell_bottom_insets.dart';

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = 8,
  });

  final double? width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class SkeletonHeroBanner extends StatelessWidget {
  const SkeletonHeroBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SkeletonBox(height: 176, borderRadius: 16),
    );
  }
}

class SkeletonDealRow extends StatelessWidget {
  const SkeletonDealRow({super.key});

  @override
  Widget build(BuildContext context) {
    return const SkeletonDealGridPage();
  }
}

class SkeletonDealGridPage extends StatelessWidget {
  const SkeletonDealGridPage({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 4,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.55,
      ),
      itemBuilder: (_, _) => const SkeletonBox(borderRadius: 12),
    );
  }
}

class SkeletonOrderList extends StatelessWidget {
  const SkeletonOrderList({super.key, this.count = 3});

  final int count;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: ShellBottomInsets.listPadding(context, left: 12, top: 12, right: 12),
      itemCount: count,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, _) => const SkeletonBox(height: 180, borderRadius: 12),
    );
  }
}

class SkeletonWishlistList extends StatelessWidget {
  const SkeletonWishlistList({super.key, this.count = 6});

  final int count;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 10,
        childAspectRatio: 0.58,
      ),
      itemCount: count,
      itemBuilder: (_, _) => const SkeletonBox(borderRadius: 12),
    );
  }
}

class SkeletonCartPage extends StatelessWidget {
  const SkeletonCartPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: ShellBottomInsets.listPadding(context, top: 8),
      children: [
        const SkeletonBox(width: 120, height: 28, borderRadius: 6),
        const SizedBox(height: 16),
        for (var i = 0; i < 3; i++) ...[
          const SkeletonBox(height: 120, borderRadius: 12),
          const SizedBox(height: 12),
        ],
        const SkeletonBox(height: 200, borderRadius: 12),
      ],
    );
  }
}

class SkeletonProductGrid extends StatelessWidget {
  const SkeletonProductGrid({super.key, this.useShellBottomInset = false});

  final bool useShellBottomInset;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: useShellBottomInset
          ? ShellBottomInsets.listPadding(context, top: 16)
          : const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.62,
      ),
      itemCount: 6,
      itemBuilder: (_, _) => const SkeletonBox(borderRadius: 12),
    );
  }
}

class SkeletonInvoicePage extends StatelessWidget {
  const SkeletonInvoicePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonBox(height: 120, borderRadius: 12),
        SizedBox(height: 16),
        SkeletonBox(height: 320, borderRadius: 12),
      ],
    );
  }
}

class SkeletonCategoryGridPage extends StatelessWidget {
  const SkeletonCategoryGridPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SkeletonBox(width: 180, height: 24, borderRadius: 6),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 9,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.58,
          ),
          itemBuilder: (_, _) => Container(
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ],
    );
  }
}

class SkeletonCategorySlider extends StatelessWidget {
  const SkeletonCategorySlider({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SkeletonBox(width: 180, height: 24, borderRadius: 6),
        const SizedBox(height: 16),
        SizedBox(
          height: CategorySliderTile.tileHeight,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: 5,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => Container(
              width: CategorySliderTile.tileWidth,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class SkeletonCategoryGrid extends StatelessWidget {
  const SkeletonCategoryGrid({
    super.key,
    this.large = false,
    this.itemCount,
  });

  final bool large;
  final int? itemCount;

  @override
  Widget build(BuildContext context) {
    final count = itemCount ?? (large ? 6 : 10);
    final crossAxisCount = large ? 3 : 5;
    final aspectRatio = large ? 0.78 : 0.72;

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonBox(
            width: large ? 180 : 120,
            height: large ? 24 : 20,
            borderRadius: 6,
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: count,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              mainAxisSpacing: large ? 8 : 14,
              crossAxisSpacing: large ? 8 : 8,
              childAspectRatio: aspectRatio,
            ),
            itemBuilder: (_, _) => Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(large ? 16 : 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SkeletonProductDetail extends StatelessWidget {
  const SkeletonProductDetail({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SkeletonBox(height: 280, borderRadius: 12),
        SizedBox(height: 16),
        SkeletonBox(width: double.infinity, height: 24, borderRadius: 6),
        SizedBox(height: 8),
        SkeletonBox(width: 120, height: 16, borderRadius: 6),
        SizedBox(height: 16),
        SkeletonBox(width: 100, height: 32, borderRadius: 6),
        SizedBox(height: 16),
        SkeletonBox(height: 120, borderRadius: 12),
      ],
    );
  }
}

class SkeletonOrderDetail extends StatelessWidget {
  const SkeletonOrderDetail({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: const [
        SizedBox(height: 12),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: SkeletonBox(height: 56, borderRadius: 12),
        ),
        SizedBox(height: 16),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: SkeletonBox(height: 48, borderRadius: 10),
        ),
        SizedBox(height: 20),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: SkeletonBox(height: 72, borderRadius: 8),
        ),
        SizedBox(height: 12),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: SkeletonBox(height: 72, borderRadius: 8),
        ),
        SizedBox(height: 12),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: SkeletonBox(height: 72, borderRadius: 8),
        ),
        SizedBox(height: 16),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: SkeletonBox(height: 180, borderRadius: 12),
        ),
      ],
    );
  }
}

class SkeletonCheckoutPage extends StatelessWidget {
  const SkeletonCheckoutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
      children: const [
        SkeletonBox(height: 140, borderRadius: 12),
        SizedBox(height: 12),
        SkeletonBox(height: 180, borderRadius: 12),
        SizedBox(height: 12),
        SkeletonBox(height: 100, borderRadius: 12),
        SizedBox(height: 12),
        SkeletonBox(height: 220, borderRadius: 12),
      ],
    );
  }
}

class SkeletonAddressList extends StatelessWidget {
  const SkeletonAddressList({super.key, this.count = 2});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < count; i++) ...[
          const SkeletonBox(height: 100, borderRadius: 12),
          if (i < count - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }
}
