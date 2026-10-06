import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../config/theme.dart';
import 'order_tracking_models.dart';

const _green = Color(0xFF2E7D32);

/// Vertical status timeline used for every order type.
class TrackingTimeline extends StatelessWidget {
  const TrackingTimeline({super.key, required this.steps});

  final List<TrackingStep> steps;

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('d MMM, h:mm a');
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          _TimelineRow(
            step: steps[i],
            isLast: i == steps.length - 1,
            nextDone: i + 1 < steps.length && steps[i + 1].done,
            timeLabel: steps[i].at != null ? time.format(steps[i].at!) : null,
          ),
      ],
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.step,
    required this.isLast,
    required this.nextDone,
    this.timeLabel,
  });

  final TrackingStep step;
  final bool isLast;
  final bool nextDone;
  final String? timeLabel;

  @override
  Widget build(BuildContext context) {
    final cancelled = step.key == 'cancelled';
    final activeColor = cancelled ? Colors.red.shade600 : _green;
    final dotColor = step.done ? activeColor : Colors.grey.shade300;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: step.current ? 22 : 18,
                  height: step.current ? 22 : 18,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                    border: step.current
                        ? Border.all(color: activeColor.withValues(alpha: 0.3), width: 4)
                        : null,
                  ),
                  child: step.done && !step.current
                      ? Icon(cancelled ? Icons.close : Icons.check, size: 12, color: Colors.white)
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2.5,
                      margin: const EdgeInsets.symmetric(vertical: 2),
                      color: nextDone ? _green : Colors.grey.shade300,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18, top: 1),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: step.current ? FontWeight.w800 : FontWeight.w600,
                      color: step.done ? AppColors.textPrimary : AppColors.textSecondary,
                    ),
                  ),
                  if (timeLabel != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      timeLabel!,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
