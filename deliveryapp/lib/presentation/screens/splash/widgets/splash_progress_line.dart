import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Full-width dotted route — each dot turns green as the scooter passes.
class SplashProgressLine extends StatelessWidget {
  const SplashProgressLine({
    super.key,
    required this.width,
    required this.fillPosition,
    this.dotSize = 6,
    this.dotSpace = 11,
  });

  final double width;
  final double fillPosition;
  final double dotSize;
  final double dotSpace;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: dotSize + 4,
      child: CustomPaint(
        size: Size(width, dotSize + 4),
        painter: _DottedProgressPainter(
          fillPosition: fillPosition,
          dotRadius: dotSize / 2,
          dotSpace: dotSpace,
          inactiveColor: const Color(0xFFC5D4C8),
          activeColor: AppColors.primary,
        ),
      ),
    );
  }
}

class _DottedProgressPainter extends CustomPainter {
  _DottedProgressPainter({
    required this.fillPosition,
    required this.dotRadius,
    required this.dotSpace,
    required this.inactiveColor,
    required this.activeColor,
  });

  final double fillPosition;
  final double dotRadius;
  final double dotSpace;
  final Color inactiveColor;
  final Color activeColor;

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height / 2;
    final step = dotRadius * 2 + dotSpace;
    var x = dotRadius;

    while (x <= size.width - dotRadius) {
      final isFilled = fillPosition >= x;

      canvas.drawCircle(
        Offset(x, y),
        dotRadius,
        Paint()..color = isFilled ? activeColor : inactiveColor,
      );
      x += step;
    }
  }

  @override
  bool shouldRepaint(covariant _DottedProgressPainter oldDelegate) =>
      oldDelegate.fillPosition != fillPosition;
}
