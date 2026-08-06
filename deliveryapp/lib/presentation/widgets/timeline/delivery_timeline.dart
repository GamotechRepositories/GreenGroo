import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';

class DeliveryTimelineStep {
  const DeliveryTimelineStep({
    required this.title,
    required this.subtitle,
    this.isCompleted = false,
    this.isActive = false,
  });

  final String title;
  final String subtitle;
  final bool isCompleted;
  final bool isActive;
}

class DeliveryTimeline extends StatelessWidget {
  const DeliveryTimeline({super.key, required this.steps});

  final List<DeliveryTimelineStep> steps;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final isLast = index == steps.length - 1;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: step.isCompleted || step.isActive
                        ? AppColors.primary
                        : AppColors.surfaceVariant,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: step.isActive
                          ? AppColors.primary
                          : AppColors.border,
                      width: step.isActive ? 4 : 1,
                    ),
                  ),
                  child: step.isCompleted
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : null,
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 48,
                    color: step.isCompleted
                        ? AppColors.primary
                        : AppColors.border,
                  ),
              ],
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      step.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontSize: 14,
                            color: step.isActive || step.isCompleted
                                ? AppColors.primary
                                : AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(step.subtitle, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
