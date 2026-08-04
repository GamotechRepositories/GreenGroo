import 'dart:async';

import 'package:flutter/material.dart';

import '../../../config/app_decorations.dart';
import '../../../config/theme.dart';

class DealsCountdownTimer extends StatefulWidget {
  const DealsCountdownTimer({super.key});

  @override
  State<DealsCountdownTimer> createState() => _DealsCountdownTimerState();
}

class _DealsCountdownTimerState extends State<DealsCountdownTimer> {
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final now = DateTime.now();
    final end = DateTime(now.year, now.month, now.day, 23, 59, 59);
    final next = end.isAfter(now) ? end.difference(now) : Duration.zero;
    if (next == _remaining) return;
    setState(() => _remaining = next);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _pad(int value) => value.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final hours = _pad(_remaining.inHours);
    final minutes = _pad(_remaining.inMinutes.remainder(60));
    final seconds = _pad(_remaining.inSeconds.remainder(60));

    return RepaintBoundary(
      child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: AppDecorations.pill(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, size: 14, color: AppColors.primary),
          const SizedBox(width: 4),
          Text(
            '$hours : $minutes : $seconds',
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    ),
    );
  }
}
