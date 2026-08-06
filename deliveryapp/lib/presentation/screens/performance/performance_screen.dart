import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/cards/statistic_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class PerformanceScreen extends StatelessWidget {
  const PerformanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.performance,
        subtitle: l10n.deliveryMetrics,
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            child: Column(
              children: [
                SizedBox(
                  width: 140,
                  height: 140,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 140,
                        height: 140,
                        child: CircularProgressIndicator(
                          value: 0.85,
                          strokeWidth: 10,
                          backgroundColor: AppColors.surfaceVariant,
                          color: AppColors.primary,
                          strokeCap: StrokeCap.round,
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(l10n.placeholderPercent, style: Theme.of(context).textTheme.headlineMedium),
                          Text(l10n.score, style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  l10n.performanceScore,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.3,
            children: [
              StatisticCard(
                title: l10n.acceptanceRate,
                value: l10n.placeholderPercent,
                icon: Icons.check_circle_outline,
              ),
              StatisticCard(
                title: l10n.onTimeDelivery,
                value: l10n.placeholderPercent,
                icon: Icons.schedule_outlined,
                iconColor: AppColors.info,
                iconBackground: Color(0xFFDBEAFE),
              ),
              StatisticCard(
                title: l10n.customerRating,
                value: l10n.placeholderDash,
                icon: Icons.star_outline,
                iconColor: Color(0xFF8B5CF6),
                iconBackground: Color(0xFFEDE9FE),
              ),
              StatisticCard(
                title: l10n.cancellationRate,
                value: l10n.placeholderPercent,
                icon: Icons.cancel_outlined,
                iconColor: AppColors.error,
                iconBackground: Color(0xFFFEE2E2),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          DashboardCard(
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  ),
                  child: Icon(Icons.leaderboard_outlined, color: AppColors.primary, size: 28),
                ),
                const SizedBox(width: AppSpacing.lg),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.leaderboardPosition, style: Theme.of(context).textTheme.bodyMedium),
                      Text(l10n.leaderboardRank, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 24)),
                      Text(l10n.inYourZone, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
