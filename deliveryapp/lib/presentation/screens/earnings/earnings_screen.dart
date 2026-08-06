import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/cards/statistic_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/layout/custom_app_bar.dart';

class EarningsScreen extends StatelessWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Earnings',
        subtitle: 'Track your income',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          const EarningsCard(
            title: "Today's Earnings",
            amount: '₹ —',
            subtitle: 'Updated live',
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: StatisticCard(
                  title: 'Weekly',
                  value: '₹ —',
                  icon: Icons.calendar_view_week_outlined,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: StatisticCard(
                  title: 'Monthly',
                  value: '₹ —',
                  icon: Icons.calendar_month_outlined,
                  iconColor: AppColors.info,
                  iconBackground: Color(0xFFDBEAFE),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: StatisticCard(
                  title: 'Bonus',
                  value: '₹ —',
                  icon: Icons.card_giftcard_outlined,
                  iconColor: AppColors.warning,
                  iconBackground: Color(0xFFFEF3C7),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: StatisticCard(
                  title: 'Incentives',
                  value: '₹ —',
                  icon: Icons.emoji_events_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'Earnings Chart'),
          const SizedBox(height: AppSpacing.md),
          DashboardCard(
            child: SizedBox(
              height: 180,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: List.generate(7, (index) {
                  final heights = [0.4, 0.55, 0.45, 0.7, 0.85, 0.6, 0.75];
                  final days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Expanded(
                            child: FractionallySizedBox(
                              heightFactor: heights[index],
                              child: Container(
                                decoration: BoxDecoration(
                                  color: index == 4
                                      ? AppColors.primary
                                      : AppColors.primary.withValues(alpha: 0.25),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(days[index], style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'Transactions'),
          const SizedBox(height: AppSpacing.md),
          ...List.generate(4, (index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: DashboardCard(
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                      ),
                      child: Icon(Icons.payments_outlined, color: AppColors.primary),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Delivery Payment', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15)),
                          Text('—', style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                    Text('₹ —', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary)),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
