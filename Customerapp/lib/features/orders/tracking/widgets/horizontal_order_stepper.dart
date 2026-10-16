import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../config/theme.dart';
import '../order_tracking_models.dart';

/// 5-step horizontal stepper matching Card 3 of the UI mockup:
/// Confirmed -> Packed -> Out for Delivery -> Delivered -> Order Complete
class HorizontalOrderStepper extends StatelessWidget {
  const HorizontalOrderStepper({
    super.key,
    required this.status,
    required this.timeline,
  });

  final String status;
  final List<TrackingStep> timeline;

  int _currentStepIndex() {
    switch (status.toLowerCase()) {
      case 'placed':
        return 0;
      case 'confirmed':
        return 0;
      case 'packed':
      case 'processing':
        return 1;
      case 'out_for_delivery':
      case 'shipping':
        return 2;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  }

  String _timeForStep(int index) {
    if (timeline.isEmpty) return '—';

    // Map step index to timeline keys
    final keyMap = [
      ['confirmed', 'placed'],
      ['packed', 'processing'],
      ['out_for_delivery', 'shipping'],
      ['delivered'],
      ['delivered', 'completed'],
    ];

    final keys = keyMap[index];
    for (final step in timeline) {
      if (keys.contains(step.key.toLowerCase()) && step.at != null) {
        return DateFormat('hh:mm a').format(step.at!);
      }
    }
    return '—';
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = _currentStepIndex();

    final steps = [
      _StepDef(title: 'Confirmed', icon: Icons.check_rounded),
      _StepDef(title: 'Packed', icon: Icons.inventory_2_outlined),
      _StepDef(title: 'Out for Delivery', icon: Icons.delivery_dining_rounded),
      _StepDef(title: 'Delivered', icon: Icons.check_rounded),
      _StepDef(title: 'Order Complete', icon: Icons.person_outline_rounded),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Status',
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (int i = 0; i < steps.length; i++) ...[
                    Expanded(
                      child: _StepNode(
                        step: steps[i],
                        isDone: i < activeIndex || (i == activeIndex && status == 'delivered'),
                        isActive: i == activeIndex && status != 'delivered',
                        timestamp: _timeForStep(i),
                      ),
                    ),
                    if (i < steps.length - 1)
                      Container(
                        width: constraints.maxWidth * 0.06,
                        margin: const EdgeInsets.only(top: 13),
                        height: 1.8,
                        color: i < activeIndex
                            ? AppColors.primary
                            : const Color(0xFFE2E8F0),
                      ),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _StepDef {
  const _StepDef({required this.title, required this.icon});
  final String title;
  final IconData icon;
}

class _StepNode extends StatelessWidget {
  const _StepNode({
    required this.step,
    required this.isDone,
    required this.isActive,
    required this.timestamp,
  });

  final _StepDef step;
  final bool isDone;
  final bool isActive;
  final String timestamp;

  @override
  Widget build(BuildContext context) {
    final bool highlighted = isDone || isActive;
    const activeGreen = AppColors.primary;
    const inactiveGrey = Color(0xFFE2E8F0);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Step Icon Circle
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: highlighted ? activeGreen : inactiveGrey,
            shape: BoxShape.circle,
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: activeGreen.withValues(alpha: 0.35),
                      blurRadius: 5,
                      offset: const Offset(0, 1.5),
                    ),
                  ]
                : null,
          ),
          child: Icon(
            step.icon,
            size: 14,
            color: highlighted ? Colors.white : const Color(0xFF94A3B8),
          ),
        ),
        const SizedBox(height: 5),
        // Step Title
        Text(
          step.title,
          textAlign: TextAlign.center,
          maxLines: 2,
          style: TextStyle(
            fontSize: 9.5,
            fontWeight: highlighted ? FontWeight.w700 : FontWeight.w500,
            color: highlighted ? const Color(0xFF0F172A) : const Color(0xFF64748B),
            height: 1.15,
          ),
        ),
        const SizedBox(height: 2),
        // Step Time
        Text(
          timestamp,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 8.5,
            fontWeight: FontWeight.w500,
            color: highlighted && timestamp != '—'
                ? const Color(0xFF64748B)
                : const Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }
}
