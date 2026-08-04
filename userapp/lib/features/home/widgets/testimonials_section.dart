import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../config/theme.dart';
import '../../../core/scroll/vertical_scroll_pause_scope.dart';
import '../../../core/utils/viewport_utils.dart';
import '../../../models/testimonial.dart';
import '../../../widgets/common/skeleton_loaders.dart';
import '../home_providers.dart';

class TestimonialsSection extends ConsumerStatefulWidget {
  const TestimonialsSection({super.key});

  @override
  ConsumerState<TestimonialsSection> createState() =>
      _TestimonialsSectionState();
}

class _TestimonialsSectionState extends ConsumerState<TestimonialsSection>
    with WidgetsBindingObserver {
  int _current = 0;
  Timer? _timer;
  int _lastCount = 0;
  bool _appActive = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final active = state == AppLifecycleState.resumed;
    if (_appActive == active) return;
    _appActive = active;
    if (active && _lastCount > 1) {
      _startTimer(_lastCount);
    } else {
      _timer?.cancel();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer(int count) {
    _timer?.cancel();
    if (!_appActive || count <= 1) return;
    _timer = Timer.periodic(const Duration(seconds: 8), (_) {
      if (!mounted || !isWidgetRoughlyVisible(context)) return;
      if (VerticalScrollPauseScope.isParentVerticalScrolling(context)) return;
      setState(() => _current = (_current + 1) % count);
    });
  }

  @override
  Widget build(BuildContext context) {
    final testimonialsAsync = ref.watch(testimonialsProvider);

    return testimonialsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SkeletonBox(width: 180, height: 18, borderRadius: 6),
            SizedBox(height: 12),
            SkeletonBox(height: 120, borderRadius: 12),
            SizedBox(height: 16),
            SkeletonBox(height: 80, borderRadius: 12),
          ],
        ),
      ),
      error: (_, _) => _ImpactStatsOnly(),
      data: (testimonials) {
        if (_lastCount != testimonials.length) {
          _lastCount = testimonials.length;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) _startTimer(testimonials.length);
          });
        }
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (testimonials.isNotEmpty) ...[
                const Text(
                  'WHAT OUR CLIENTS SAY',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 12),
                _TestimonialCard(testimonial: testimonials[_current]),
                const SizedBox(height: 20),
              ],
              const _ImpactStatsOnly(),
            ],
          ),
        );
      },
    );
  }
}

class _TestimonialCard extends StatelessWidget {
  const _TestimonialCard({required this.testimonial});

  final Testimonial testimonial;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.mobileSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: List.generate(
              5,
              (_) => const Icon(Icons.star, color: AppColors.primary, size: 16),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            testimonial.text,
            style: const TextStyle(
              color: AppColors.textSecondary,
              height: 1.5,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            testimonial.name,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          if (testimonial.role.isNotEmpty)
            Text(
              testimonial.role,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }
}

class _ImpactStatsOnly extends StatelessWidget {
  const _ImpactStatsOnly();

  static const _stats = [
    ('5000+', 'Happy Clients'),
    ('100K+', 'Units Sold'),
    ('500+', 'Cities Served'),
    ('99%', 'On-Time Delivery'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'OUR IMPACT IN NUMBERS',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
            fontSize: 13,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _stats.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final stat = _stats[index];
              return Container(
                width: 140,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      stat.$1,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stat.$2,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
