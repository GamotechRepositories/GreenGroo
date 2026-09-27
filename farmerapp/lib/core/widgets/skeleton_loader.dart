import 'package:flutter/material.dart';

/// 60fps Smooth Moving Highlight Shimmer
class SkeletonShimmer extends StatefulWidget {
  const SkeletonShimmer({super.key, required this.child});

  final Widget child;

  @override
  State<SkeletonShimmer> createState() => _SkeletonShimmerState();
}

class _SkeletonShimmerState extends State<SkeletonShimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            final x = _controller.value * (bounds.width * 2) - bounds.width;
            return const LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                Color(0xFFE2E8F0),
                Color(0xFFF8FAFC),
                Color(0xFFE2E8F0),
              ],
              stops: [0.0, 0.5, 1.0],
            ).createShader(Rect.fromLTWH(x, 0, bounds.width, bounds.height));
          },
          child: widget.child,
        );
      },
    );
  }
}

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    this.width,
    required this.height,
    this.radius = 8,
    this.margin,
  });

  final double? width;
  final double height;
  final double radius;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

Widget _buildSectionHeaderSkeleton(String title) {
  return Padding(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: const [
            SkeletonBox(width: 18, height: 18, radius: 4),
            SizedBox(width: 8),
            SkeletonBox(width: 140, height: 14, radius: 4),
          ],
        ),
        const SkeletonBox(width: 60, height: 12, radius: 4),
      ],
    ),
  );
}

// ==========================================
// 1. 🛍️ PRODUCTS SCREEN SKELETON LOADER
// ==========================================
class ProductsSkeletonLoader extends StatelessWidget {
  const ProductsSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: Column(
            children: [
              // Search & Filter header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const SkeletonBox(height: 44, radius: 12),
                    const SizedBox(height: 12),
                    Row(
                      children: const [
                        SkeletonBox(width: 70, height: 28, radius: 14),
                        SizedBox(width: 8),
                        SkeletonBox(width: 85, height: 28, radius: 14),
                        SizedBox(width: 8),
                        SkeletonBox(width: 95, height: 28, radius: 14),
                      ],
                    ),
                  ],
                ),
              ),
              // Products list
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  itemCount: 4,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (_, _) => Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SkeletonBox(width: 80, height: 80, radius: 12),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              SkeletonBox(width: 140, height: 15, radius: 4),
                              SizedBox(height: 6),
                              SkeletonBox(width: 90, height: 12, radius: 4),
                              SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  SkeletonBox(width: 80, height: 16, radius: 4),
                                  SkeletonBox(width: 65, height: 20, radius: 8),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 2. 📦 ORDERS SCREEN SKELETON LOADER
// ==========================================
class OrdersSkeletonLoader extends StatelessWidget {
  const OrdersSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: SkeletonShimmer(
          child: Column(
            children: [
              // Tab bar skeleton
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  children: const [
                    SkeletonBox(width: 60, height: 28, radius: 14),
                    SizedBox(width: 8),
                    SkeletonBox(width: 70, height: 28, radius: 14),
                    SizedBox(width: 8),
                    SkeletonBox(width: 80, height: 28, radius: 14),
                    SizedBox(width: 8),
                    SkeletonBox(width: 75, height: 28, radius: 14),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              // Orders list skeleton
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  itemCount: 4,
                  separatorBuilder: (_, _) => const SizedBox(height: 14),
                  itemBuilder: (_, _) => Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            SkeletonBox(width: 110, height: 14, radius: 4),
                            SkeletonBox(width: 75, height: 20, radius: 8),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const SkeletonBox(width: 44, height: 44, radius: 10),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  SkeletonBox(width: 130, height: 14, radius: 4),
                                  SizedBox(height: 4),
                                  SkeletonBox(width: 90, height: 12, radius: 4),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            SkeletonBox(width: 80, height: 16, radius: 4),
                            SkeletonBox(width: 90, height: 16, radius: 4),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: const [
                            Expanded(child: SkeletonBox(height: 34, radius: 8)),
                            SizedBox(width: 8),
                            Expanded(child: SkeletonBox(height: 34, radius: 8)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 3. 🌾 CROPS SCREEN SKELETON LOADER
// ==========================================
class CropsSkeletonLoader extends StatelessWidget {
  const CropsSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top stats
                Row(
                  children: const [
                    Expanded(child: SkeletonBox(height: 75, radius: 14)),
                    SizedBox(width: 10),
                    Expanded(child: SkeletonBox(height: 75, radius: 14)),
                  ],
                ),
                const SizedBox(height: 18),
                _buildSectionHeaderSkeleton('लागवड केलेली पिके (Crops)'),
                // Crop Cards
                ...List.generate(3, (i) => Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Row(
                            children: [
                              SkeletonBox(width: 36, height: 36, radius: 10),
                              SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SkeletonBox(width: 110, height: 15, radius: 4),
                                  SizedBox(height: 4),
                                  SkeletonBox(width: 70, height: 12, radius: 4),
                                ],
                              ),
                            ],
                          ),
                          SkeletonBox(width: 60, height: 20, radius: 8),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const SkeletonBox(height: 10, radius: 5),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          SkeletonBox(width: 90, height: 14, radius: 4),
                          SkeletonBox(width: 90, height: 14, radius: 4),
                        ],
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 4. 💰 EARNINGS SCREEN SKELETON LOADER
// ==========================================
class EarningsSkeletonLoader extends StatelessWidget {
  const EarningsSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Filter chips
                Row(
                  children: const [
                    SkeletonBox(width: 70, height: 26, radius: 13),
                    SizedBox(width: 6),
                    SkeletonBox(width: 85, height: 26, radius: 13),
                    SizedBox(width: 6),
                    SkeletonBox(width: 80, height: 26, radius: 13),
                  ],
                ),
                const SizedBox(height: 14),
                // 4 Metric cards
                Row(
                  children: const [
                    Expanded(child: SkeletonBox(height: 72, radius: 12)),
                    SizedBox(width: 8),
                    Expanded(child: SkeletonBox(height: 72, radius: 12)),
                    SizedBox(width: 8),
                    Expanded(child: SkeletonBox(height: 72, radius: 12)),
                    SizedBox(width: 8),
                    Expanded(child: SkeletonBox(height: 72, radius: 12)),
                  ],
                ),
                const SizedBox(height: 18),
                // Trend Chart Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      SkeletonBox(width: 140, height: 16, radius: 4),
                      SizedBox(height: 14),
                      SkeletonBox(height: 130, radius: 8),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _buildSectionHeaderSkeleton('व्यवहार इतिहास (Passbook)'),
                // Passbook list items
                ...List.generate(4, (i) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Row(
                        children: [
                          SkeletonBox(width: 34, height: 34, radius: 8),
                          SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SkeletonBox(width: 110, height: 13, radius: 4),
                              SizedBox(height: 4),
                              SkeletonBox(width: 70, height: 11, radius: 4),
                            ],
                          ),
                        ],
                      ),
                      SkeletonBox(width: 65, height: 18, radius: 4),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 5. 👤 PROFILE SCREEN SKELETON LOADER
// ==========================================
class ProfileSkeletonLoader extends StatelessWidget {
  const ProfileSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 10),
                const SkeletonBox(width: 80, height: 80, radius: 40),
                const SizedBox(height: 12),
                const SkeletonBox(width: 140, height: 18, radius: 4),
                const SizedBox(height: 6),
                const SkeletonBox(width: 100, height: 13, radius: 4),
                const SizedBox(height: 20),
                // Section cards
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      SkeletonBox(width: 130, height: 16, radius: 4),
                      SizedBox(height: 14),
                      SkeletonBox(height: 20, radius: 4),
                      SizedBox(height: 10),
                      SkeletonBox(height: 20, radius: 4),
                      SizedBox(height: 10),
                      SkeletonBox(height: 20, radius: 4),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      SkeletonBox(width: 130, height: 16, radius: 4),
                      SizedBox(height: 14),
                      SkeletonBox(height: 20, radius: 4),
                      SizedBox(height: 10),
                      SkeletonBox(height: 20, radius: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 6. 📄 DOCUMENTS SCREEN SKELETON LOADER
// ==========================================
class DocumentsSkeletonLoader extends StatelessWidget {
  const DocumentsSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonBox(height: 70, radius: 14),
                const SizedBox(height: 18),
                _buildSectionHeaderSkeleton('कागदपत्रे यादी (Documents)'),
                ...List.generate(5, (i) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: const [
                      SkeletonBox(width: 38, height: 38, radius: 10),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SkeletonBox(width: 120, height: 14, radius: 4),
                            SizedBox(height: 4),
                            SkeletonBox(width: 80, height: 11, radius: 4),
                          ],
                        ),
                      ),
                      SkeletonBox(width: 70, height: 26, radius: 8),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 7. 🏛️ SCHEMES SCREEN SKELETON LOADER
// ==========================================
class SchemesSkeletonLoader extends StatelessWidget {
  const SchemesSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonBox(height: 44, radius: 12),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    SkeletonBox(width: 65, height: 26, radius: 13),
                    SizedBox(width: 8),
                    SkeletonBox(width: 80, height: 26, radius: 13),
                    SizedBox(width: 8),
                    SkeletonBox(width: 90, height: 26, radius: 13),
                  ],
                ),
                const SizedBox(height: 16),
                ...List.generate(4, (i) => Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          SkeletonBox(width: 150, height: 15, radius: 4),
                          SkeletonBox(width: 70, height: 20, radius: 8),
                        ],
                      ),
                      SizedBox(height: 10),
                      SkeletonBox(height: 12, radius: 4),
                      SizedBox(height: 6),
                      SkeletonBox(width: 200, height: 12, radius: 4),
                      SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          SkeletonBox(width: 90, height: 14, radius: 4),
                          SkeletonBox(width: 80, height: 26, radius: 8),
                        ],
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 8. 🏷️ MARKET COMPARISON SKELETON LOADER
// ==========================================
class MarketComparisonSkeletonLoader extends StatelessWidget {
  const MarketComparisonSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonBox(height: 42, radius: 10),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    SkeletonBox(width: 70, height: 24, radius: 12),
                    SizedBox(width: 6),
                    SkeletonBox(width: 70, height: 24, radius: 12),
                    SizedBox(width: 6),
                    SkeletonBox(width: 90, height: 24, radius: 12),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: const [
                      SkeletonBox(width: 110, height: 110, radius: 55),
                      SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          children: [
                            SkeletonBox(height: 22, radius: 6),
                            SizedBox(height: 8),
                            SkeletonBox(height: 22, radius: 6),
                            SizedBox(height: 8),
                            SkeletonBox(height: 22, radius: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                _buildSectionHeaderSkeleton('विविध बाजार भाव तुलना (APMC Prices)'),
                ...List.generate(4, (i) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonBox(width: 120, height: 14, radius: 4),
                          SizedBox(height: 4),
                          SkeletonBox(width: 80, height: 11, radius: 4),
                        ],
                      ),
                      SkeletonBox(width: 60, height: 18, radius: 6),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 9. 🔔 NOTIFICATIONS SKELETON LOADER
// ==========================================
class NotificationsSkeletonLoader extends StatelessWidget {
  const NotificationsSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8F5),
      body: SafeArea(
        child: SkeletonShimmer(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: 6,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, _) => Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: const [
                  SkeletonBox(width: 36, height: 36, radius: 18),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 140, height: 14, radius: 4),
                        SizedBox(height: 4),
                        SkeletonBox(width: 190, height: 11, radius: 4),
                      ],
                    ),
                  ),
                  SizedBox(width: 8),
                  SkeletonBox(width: 40, height: 10, radius: 4),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 10. 📦 ORDER LIST SKELETON (For sub-screens & dialogs)
// ==========================================
class OrderListSkeleton extends StatelessWidget {
  final int count;
  final bool shrinkWrap;
  const OrderListSkeleton({super.key, this.count = 4, this.shrinkWrap = false});

  @override
  Widget build(BuildContext context) {
    return SkeletonShimmer(
      child: ListView.separated(
        shrinkWrap: shrinkWrap,
        physics: shrinkWrap ? const NeverScrollableScrollPhysics() : null,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        itemCount: count,
        separatorBuilder: (_, _) => const SizedBox(height: 14),
        itemBuilder: (_, _) => Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  SkeletonBox(width: 110, height: 14, radius: 4),
                  SkeletonBox(width: 75, height: 20, radius: 8),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const SkeletonBox(width: 44, height: 44, radius: 10),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        SkeletonBox(width: 130, height: 14, radius: 4),
                        SizedBox(height: 4),
                        SkeletonBox(width: 90, height: 12, radius: 4),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  SkeletonBox(width: 80, height: 16, radius: 4),
                  SkeletonBox(width: 90, height: 16, radius: 4),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: const [
                  Expanded(child: SkeletonBox(height: 34, radius: 8)),
                  SizedBox(width: 8),
                  Expanded(child: SkeletonBox(height: 34, radius: 8)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ==========================================
// 11. 💰 EARNINGS SKELETON (For sub-screens & dialogs)
// ==========================================
class EarningsSkeleton extends StatelessWidget {
  final int count;
  const EarningsSkeleton({super.key, this.count = 2});

  @override
  Widget build(BuildContext context) {
    return SkeletonShimmer(
      child: Column(
        children: List.generate(
          count,
          (i) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SkeletonBox(width: 140, height: 16, radius: 4),
                SizedBox(height: 10),
                SkeletonBox(height: 60, radius: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


