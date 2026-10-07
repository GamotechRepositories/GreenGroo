import 'package:flutter/material.dart';

import '../../../config/theme.dart';

/// Pre-order journey: vendor confirms → dark store → rider → delivered.
const List<MapEntry<String, String>> kPreOrderProgressSteps = [
  MapEntry('awaiting_vendor', 'Awaiting confirmation'),
  MapEntry('confirmed', 'Confirmed'),
  MapEntry('preparing', 'Being prepared'),
  MapEntry('dispatched', 'On the way to dark store'),
  MapEntry('at_store', 'Reached dark store'),
  MapEntry('rider_assigned', 'Delivery partner assigned'),
  MapEntry('out_for_delivery', 'Out for delivery'),
  MapEntry('delivered', 'Delivered'),
];

const Map<String, String> _closedText = {
  'rejected': 'The store could not accept this pre-order. Any payment will be refunded.',
  'cancelled': 'This pre-order was cancelled.',
  'failed': 'Delivery could not be completed.',
};

class PreOrderProgressSteps extends StatelessWidget {
  const PreOrderProgressSteps({
    super.key,
    required this.progress,
    this.label = '',
  });

  /// Progress key from the API (`awaiting_vendor`, `at_store`, …).
  final String progress;
  final String label;

  static const Color _green = Color(0xFF047857);

  @override
  Widget build(BuildContext context) {
    if (progress.isEmpty) return const SizedBox.shrink();

    final closed = _closedText[progress];
    if (closed != null) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label.isNotEmpty ? label : 'Pre-order closed',
              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: Color(0xFFB91C1C)),
            ),
            const SizedBox(height: 4),
            Text(closed, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
          ],
        ),
      );
    }

    final current = kPreOrderProgressSteps.indexWhere((s) => s.key == progress);
    final allDone = progress == 'delivered';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFD1FAE5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PRE-ORDER STATUS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 10),
          for (var i = 0; i < kPreOrderProgressSteps.length; i++)
            _StepRow(
              index: i,
              label: kPreOrderProgressSteps[i].value,
              done: allDone || i < current,
              active: !allDone && i == current,
              isLast: i == kPreOrderProgressSteps.length - 1,
            ),
        ],
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.index,
    required this.label,
    required this.done,
    required this.active,
    required this.isLast,
  });

  final int index;
  final String label;
  final bool done;
  final bool active;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    const green = PreOrderProgressSteps._green;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            children: [
              Container(
                width: 20,
                height: 20,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: done
                      ? green
                      : active
                          ? const Color(0xFFD1FAE5)
                          : const Color(0xFFF1F5F9),
                  border: active ? Border.all(color: green, width: 2) : null,
                ),
                child: done
                    ? const Icon(Icons.check, size: 13, color: Colors.white)
                    : Text(
                        '${index + 1}',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: active ? green : const Color(0xFF94A3B8),
                        ),
                      ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    color: done ? green : const Color(0xFFE2E8F0),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 2, bottom: isLast ? 0 : 12),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: active ? FontWeight.w800 : (done ? FontWeight.w600 : FontWeight.w400),
                  color: active
                      ? green
                      : done
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
