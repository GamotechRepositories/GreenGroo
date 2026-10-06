import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';

class ProgressRing extends StatelessWidget {
  const ProgressRing({
    super.key,
    required this.percent,
    required this.label,
    this.color,
    this.size = 92,
    this.strokeWidth = 9,
    this.centerText,
    this.caption,
  });

  final double? percent;
  final String label;
  final Color? color;
  final double size;
  final double strokeWidth;
  final String? centerText;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppColors.primary;
    final target = ((percent ?? 0) / 100).clamp(0.0, 1.0);
    final text = centerText ??
        (percent == null
            ? '—'
            : '${percent! % 1 == 0 ? percent!.toInt() : percent!.toStringAsFixed(1)}%');

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: target),
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeOutCubic,
            builder: (context, value, _) => Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: value,
                  strokeWidth: strokeWidth,
                  strokeCap: StrokeCap.round,
                  backgroundColor: accent.withValues(alpha: 0.12),
                  valueColor: AlwaysStoppedAnimation(accent),
                ),
                Center(
                  child: Text(
                    text,
                    style: GoogleFonts.inter(
                      fontSize: size * 0.2,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        if (caption != null) ...[
          const SizedBox(height: 2),
          Text(
            caption!,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
          ),
        ],
      ],
    );
  }
}

class SegmentBar extends StatelessWidget {
  const SegmentBar({super.key, required this.segments, this.height = 10});

  final List<(double, Color)> segments;
  final double height;

  @override
  Widget build(BuildContext context) {
    final total = segments.fold<double>(0, (s, e) => s + (e.$1 > 0 ? e.$1 : 0));
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        height: height,
        child: total <= 0
            ? ColoredBox(color: AppColors.border)
            : Row(
                children: [
                  for (final s in segments)
                    if (s.$1 > 0)
                      Expanded(
                        flex: (s.$1 / total * 1000).round().clamp(1, 1000),
                        child: ColoredBox(color: s.$2),
                      ),
                ],
              ),
      ),
    );
  }
}
