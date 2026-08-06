import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Attendance',
        subtitle: 'Track your working hours',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(onPressed: () {}, icon: const Icon(Icons.chevron_left)),
                    Text('Month Year', style: Theme.of(context).textTheme.titleMedium),
                    IconButton(onPressed: () {}, icon: const Icon(Icons.chevron_right)),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                  ),
                  itemCount: 35,
                  itemBuilder: (context, index) {
                    final isToday = index == 18;
                    final isPresent = index < 28 && index > 4;
                    return Container(
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isToday
                            ? AppColors.primary
                            : isPresent
                                ? AppColors.primaryLight
                                : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${(index % 31) + 1}',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: isToday
                              ? Colors.white
                              : isPresent
                                  ? AppColors.primaryDark
                                  : AppColors.textMuted,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(child: _TimeCard(title: 'Login Time', value: '— : —')),
              const SizedBox(width: AppSpacing.md),
              Expanded(child: _TimeCard(title: 'Logout Time', value: '— : —')),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(child: _TimeCard(title: 'Working Hours', value: '— h — m')),
              const SizedBox(width: AppSpacing.md),
              Expanded(child: _TimeCard(title: 'Break Time', value: '— m')),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Attendance History', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
          const SizedBox(height: AppSpacing.md),
          ...List.generate(5, (_) {
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
                      child: Icon(Icons.event_available_outlined, color: AppColors.primary),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Date —', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15)),
                          Text('— h — m worked', style: Theme.of(context).textTheme.bodyMedium),
                        ],
                      ),
                    ),
                    Icon(Icons.check_circle, color: AppColors.primary, size: 20),
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

class _TimeCard extends StatelessWidget {
  const _TimeCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: AppSpacing.sm),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
        ],
      ),
    );
  }
}
