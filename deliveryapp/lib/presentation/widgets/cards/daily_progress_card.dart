import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/daily_progress.dart';
import '../../../l10n/app_localizations.dart';
import 'dashboard_card.dart';

class DailyProgressCard extends StatelessWidget {
  const DailyProgressCard({
    super.key,
    required this.progress,
  });

  final DailyProgress progress;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final percent = progress.overallPercent;

    return DashboardCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.dailyProgress,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l10n.dailyProgressSubtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              _ProgressDial(percent: percent),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _ProgressBarRow(
            label: l10n.loginHours,
            current: progress.loginHoursLabel,
            target: progress.loginTargetLabel,
            progress: progress.loginProgress,
            color: AppColors.info,
          ),
          const SizedBox(height: AppSpacing.md),
          _ProgressBarRow(
            label: l10n.totalOrdersToday,
            current: '${progress.ordersCompleted}',
            target: '${progress.ordersTarget}',
            progress: progress.ordersProgress,
            color: AppColors.warning,
          ),
          const SizedBox(height: AppSpacing.md),
          _ProgressBarRow(
            label: l10n.todaysEarnings,
            current: progress.earningsLabel,
            target: progress.earningsTargetLabel,
            progress: progress.earningsProgress,
            color: AppColors.primary,
          ),
        ],
      ),
    );
  }
}

class _ProgressDial extends StatelessWidget {
  const _ProgressDial({required this.percent});

  final int percent;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      height: 88,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(88, 88),
            painter: _DialPainter(
              progress: percent / 100,
              trackColor: AppColors.primaryLight,
              progressColor: AppColors.primary,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$percent%',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                AppLocalizations.of(context).complete,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DialPainter extends CustomPainter {
  _DialPainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
  });

  final double progress;
  final Color trackColor;
  final Color progressColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 6;
    const stroke = 8.0;

    final track = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    final arc = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, track);

    final sweep = 2 * math.pi * progress.clamp(0, 1);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweep,
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(covariant _DialPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _ProgressBarRow extends StatelessWidget {
  const _ProgressBarRow({
    required this.label,
    required this.current,
    required this.target,
    required this.progress,
    required this.color,
  });

  final String label;
  final String current;
  final String target;
  final double progress;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final pct = (progress.clamp(0, 1) * 100).round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            Text(
              '$current / $target',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(width: 8),
            Text(
              '$pct%',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progress.clamp(0, 1),
            minHeight: 8,
            backgroundColor: AppColors.surfaceVariant,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
