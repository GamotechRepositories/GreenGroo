import 'package:flutter/material.dart';

/// Moving highlight used by the order and earnings placeholder cards.
class SkeletonShimmer extends StatefulWidget {
  const SkeletonShimmer({super.key, required this.child});

  final Widget child;

  @override
  State<SkeletonShimmer> createState() => _SkeletonShimmerState();
}

class _SkeletonShimmerState extends State<SkeletonShimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
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
          shaderCallback: (rect) {
            final slide = -1.2 + (_controller.value * 2.4);
            return LinearGradient(
              begin: Alignment(slide, 0),
              end: Alignment(slide + 0.8, 0),
              colors: const [
                Color(0xFFE5E7EB),
                Color(0xFFF8FAFC),
                Color(0xFFE5E7EB),
              ],
            ).createShader(rect);
          },
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    this.width,
    required this.height,
    this.radius = 6,
  });

  final double? width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE5E7EB),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

class OrderListSkeleton extends StatelessWidget {
  const OrderListSkeleton({super.key, this.count = 4, this.shrinkWrap = false});

  final int count;
  final bool shrinkWrap;

  @override
  Widget build(BuildContext context) {
    return SkeletonShimmer(
      child: ListView.separated(
        shrinkWrap: shrinkWrap,
        physics: shrinkWrap ? const NeverScrollableScrollPhysics() : null,
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 28),
        itemCount: count,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (_, _) => const _OrderCardSkeleton(),
      ),
    );
  }
}

class _OrderCardSkeleton extends StatelessWidget {
  const _OrderCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(flex: 4, child: SkeletonBox(height: 14)),
              SizedBox(width: 10),
              Expanded(flex: 5, child: SkeletonBox(height: 18, radius: 4)),
              SizedBox(width: 10),
              SkeletonBox(width: 64, height: 18, radius: 6),
            ],
          ),
          SizedBox(height: 10),
          SkeletonBox(height: 42, radius: 8),
          SizedBox(height: 10),
          SkeletonBox(height: 18, radius: 4),
          SizedBox(height: 6),
          SkeletonBox(height: 18, radius: 4),
          SizedBox(height: 6),
          SkeletonBox(height: 18, radius: 4),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: SkeletonBox(height: 36, radius: 8)),
              SizedBox(width: 8),
              Expanded(child: SkeletonBox(height: 36, radius: 8)),
            ],
          ),
        ],
      ),
    );
  }
}

class EarningsSkeleton extends StatelessWidget {
  const EarningsSkeleton({super.key, this.count = 2});

  final int count;

  @override
  Widget build(BuildContext context) {
    return SkeletonShimmer(
      child: Column(
        children: List.generate(count, (index) {
          return Padding(
            padding: EdgeInsets.only(bottom: index == count - 1 ? 0 : 12),
            child: const _EarningsCardSkeleton(),
          );
        }),
      ),
    );
  }
}

class _EarningsCardSkeleton extends StatelessWidget {
  const _EarningsCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SkeletonBox(width: 36, height: 36, radius: 8),
              SizedBox(width: 8),
              Expanded(child: SkeletonBox(height: 14)),
              SizedBox(width: 12),
              SkeletonBox(width: 72, height: 14),
            ],
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: SkeletonBox(height: 28)),
              SizedBox(width: 8),
              Expanded(child: SkeletonBox(height: 28)),
              SizedBox(width: 8),
              Expanded(child: SkeletonBox(height: 28)),
            ],
          ),
          SizedBox(height: 10),
          SkeletonBox(height: 22, radius: 4),
          SizedBox(height: 4),
          SkeletonBox(height: 22, radius: 4),
          SizedBox(height: 4),
          SkeletonBox(height: 22, radius: 4),
        ],
      ),
    );
  }
}
