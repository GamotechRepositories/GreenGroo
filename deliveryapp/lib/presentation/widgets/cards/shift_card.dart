import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/models/shift.dart';
import '../../../l10n/app_localizations.dart';
import '../chips/status_chip.dart';
import 'dashboard_card.dart';

class ShiftCard extends StatelessWidget {
  const ShiftCard({
    super.key,
    required this.shift,
    this.onBook,
    this.compact = false,
  });

  final Shift shift;
  final VoidCallback? onBook;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAvailable = shift.isAvailable;

    return DashboardCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isAvailable
                      ? const Color(0xFFDBEAFE)
                      : AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.schedule_rounded,
                  color: isAvailable ? AppColors.info : AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shift.dateLabel,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontSize: compact ? 14 : 15,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text(
                      shift.timeRange,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusChip(
                label: isAvailable ? l10n.shiftAvailable : l10n.shiftBooked,
                type: isAvailable ? StatusType.info : StatusType.online,
              ),
            ],
          ),
          if (!compact) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Icon(Icons.location_on_outlined,
                    size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(shift.area, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
            if (shift.earningPotential != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Icon(Icons.payments_outlined,
                      size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    shift.earningPotential!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                  ),
                  if (shift.ordersExpected != null) ...[
                    const Spacer(),
                    Text(
                      '${shift.ordersExpected} ${l10n.ordersExpected}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ],
            if (isAvailable && onBook != null) ...[
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onBook,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(color: AppColors.primary),
                  ),
                  child: Text(l10n.bookShift),
                ),
              ),
            ],
          ] else ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              shift.area,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}
